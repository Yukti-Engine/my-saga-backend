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
    data: `{\n  "widgetId": "36636c745178333137343435",\n  "identifier": "${phone}", "tokenAuth":"${msg91_api}"\n}\n`
  };

  try {
    const res = await axios.request(options);
    return res.data.message;
  } catch (error) {
    console.error(error);
    return "failed";
  } 
}


export async function verify(requestId: string, otp: string): Promise<boolean> {
  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/widget/verifyOtp',
    headers: {'content-type': 'application/json'},
    data: `{\n  "widgetId": "36636c745178333137343435",\n  "reqId": "${requestId}",\n  "otp": "${otp}", "tokenAuth":"${msg91_api}"\n}\n`
  };

  try {
    await axios.request(options);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function retry(requestId: string): Promise<boolean> {
  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/widget/retryOtp',
    headers: {'content-type': 'application/json'},
    data: `{\n  "widgetId": "36636c745178333137343435",\n  "reqId": "${requestId}", "tokenAuth":"${msg91_api}" \n}`
  };

  try {
    await axios.request(options);
    return true;
  } catch (error) {
    return false;
  }
}