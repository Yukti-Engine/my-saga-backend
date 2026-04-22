import axios from "axios";

const msg91_api = process.env.MSG91_AUTH_KEY;

if (!msg91_api) {
  throw new Error("MSG91_AUTH_KEY is not defined in environment variables");
}

export async function sendOtp(phone: string): Promise<string> {

  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/widget/sendOtp',
    headers: {'content-type': 'application/json'},
    data: `{\n  "widgetId": "366475304c4c343234373730",\n  "identifier": "${phone}", "tokenAuth":"${msg91_api}"\n}\n`
  };

  const res = await axios.request(options);
  if (res.data.type === "error" || !res.data.message) {
    throw new Error(`MSG91 sendOtp failed: ${JSON.stringify(res.data)}`);
  }
  return res.data.message;
}


export async function verify(requestId: string, otp: string): Promise<boolean> {
  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/widget/verifyOtp',
    headers: {'content-type': 'application/json'},
    data: `{\n  "widgetId": "366475304c4c343234373730",\n  "reqId": "${requestId}",\n  "otp": "${otp}", "tokenAuth":"${msg91_api}"\n}\n`
  };

  await axios.request(options);
  return true;
}

export async function retry(requestId: string): Promise<boolean> {
  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/widget/retryOtp',
    headers: {'content-type': 'application/json'},
    data: `{\n  "widgetId": "366475304c4c343234373730",\n  "reqId": "${requestId}", "tokenAuth":"${msg91_api}" \n}`
  };

  await axios.request(options);
  return true;
}
