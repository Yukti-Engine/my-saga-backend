-- Wallet & Payment Infrastructure Migration

-- New types
CREATE TYPE wallet_tx_type   AS ENUM ('topup', 'lobby_debit', 'lobby_refund');
CREATE TYPE wallet_tx_status AS ENUM ('created', 'success', 'failed');
CREATE TYPE payout_recipient AS ENUM ('boss', 'organizer', 'platform');
CREATE TYPE payout_status    AS ENUM ('held', 'released', 'failed');

-- New tables
CREATE TABLE wallets (
    user_id   INTEGER PRIMARY KEY REFERENCES users(id),
    balance   BIGINT  NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE wallet_transactions (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id),
    type                 wallet_tx_type NOT NULL,
    amount_paise         BIGINT NOT NULL CHECK (amount_paise > 0),
    razorpay_order_id    TEXT,
    razorpay_payment_id  TEXT,
    match_request_id     INTEGER,
    status               wallet_tx_status NOT NULL DEFAULT 'created',
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payouts (
    id                   SERIAL PRIMARY KEY,
    adventure_id         INTEGER NOT NULL REFERENCES adventures(id),
    recipient_type       payout_recipient NOT NULL,
    recipient_id         INTEGER NOT NULL,
    amount_paise         BIGINT NOT NULL CHECK (amount_paise > 0),
    razorpay_transfer_id TEXT,
    status               payout_status NOT NULL DEFAULT 'held',
    hold_until           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Column additions
ALTER TABLE bosses     ADD COLUMN razorpay_account_id TEXT;
ALTER TABLE organizers ADD COLUMN razorpay_account_id TEXT;

-- Replace dismiss_match_request to return user_ids and pay_per_head
DROP FUNCTION IF EXISTS dismiss_match_request(integer);
CREATE FUNCTION dismiss_match_request(p_org_id integer) RETURNS TABLE(id integer, user_ids integer[], pay_per_head integer)
    LANGUAGE sql
    AS $$
  UPDATE match_requests
  SET is_active = FALSE
  WHERE org_id = p_org_id AND is_active = TRUE
  RETURNING match_requests.id, match_requests.user_ids, match_requests.pay_per_head;
$$;

-- Wallet functions
CREATE FUNCTION ensure_wallet(p_user_id integer) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id;
  RETURN v_balance;
END;
$$;

CREATE FUNCTION credit_wallet(p_user_id integer, p_amount bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  INSERT INTO wallets (user_id, balance) VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + p_amount;
  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id;
  RETURN v_balance;
END;
$$;

CREATE FUNCTION debit_wallet(p_user_id integer, p_amount bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  UPDATE wallets SET balance = balance - p_amount
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING balance INTO v_balance;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  RETURN v_balance;
END;
$$;

CREATE FUNCTION create_payout(
  p_adventure_id integer,
  p_recipient_type payout_recipient,
  p_recipient_id integer,
  p_amount_paise bigint,
  p_hold_until timestamptz
) RETURNS integer
    LANGUAGE sql
    AS $$
  INSERT INTO payouts (adventure_id, recipient_type, recipient_id, amount_paise, hold_until)
  VALUES (p_adventure_id, p_recipient_type, p_recipient_id, p_amount_paise, p_hold_until)
  RETURNING id;
$$;
