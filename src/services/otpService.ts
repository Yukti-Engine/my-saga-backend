import "dotenv/config";
import axios from "axios";

const msg91_api = process.env.MSG91_AUTH_KEY;

if (!msg91_api) {
  throw new Error("MSG91_AUTH_KEY is not defined in environment variables");
}

export async function sendOtp(phone: string): Promise<string> {

  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/widget/sendOtp',
    headers: {authkey: msg91_api, 'content-type': 'application/json'},
    data: `{\n  "widgetId": "mysaga",\n  "identifier": "${phone}"\n}\n`
  };

  try {
    return (await axios.request(options)).message;
  } catch (error) {
    console.error(error);
    return "failed";
  } 
}


export async function verify(requestId: string, otp: string): Promise<boolean> {
  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/widget/verifyOtp',
    headers: {authkey: msg91_api, 'content-type': 'application/json'},
    data: `{\n  "widgetId": "mysaga",\n  "reqId": "${requestId}",\n  "otp": "${otp}"\n}\n`
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
    headers: {authkey: msg91_api, 'content-type': 'application/json'},
    data: `{\n  "widgetId": "mysaga",\n  "reqId": "${requestId}" \n}`
  };

  try {
    await axios.request(options);
    return true;
  } catch (error) {
    return false;
  }
}