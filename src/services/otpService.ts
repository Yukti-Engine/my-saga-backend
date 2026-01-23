import "dotenv/config";
import axios from "axios";

const fs_api = process.env.FACTOR_SMS;

if (!fs_api) {
  throw new Error("FACTOR_SMS is not defined in environment variables");
}

export async function sendOtp(phone: string): Promise<string> {
  try {
    const url = `https://2factor.in/API/V1/${fs_api}/SMS/${phone}/AUTOGEN/OTP1`;

    const response = await axios.get(url, {
      maxBodyLength: Infinity,
    });

    console.log(response.data);

    // return something meaningful (session_id is what 2Factor usually gives)
    return response.data.Details; 
  } catch (error: any) {
    console.error("OTP send failed:", error.response?.data || error.message);
    throw error;
  }
}


export async function verify(phone: string, otp: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${fs_api}/SMS/VERIFY3/${phone}/${otp}`,
      { maxBodyLength: Infinity }
    );

    return response.data.Details === "OTP Matched";
  } catch (error: any) {
    console.error(
      "OTP verification failed:",
      error.response?.data || error.message
    );
    return false;
  }
}
