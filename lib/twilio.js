import dotenv from 'dotenv';
dotenv.config();

import logger from '../../lib/winston.js';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// logger.log('TWILIO_ACCOUNT_SID:', accountSid);
// logger.log('TWILIO_AUTH_TOKEN:', authToken ? 'exists' : 'MISSING');

export async function createVerification(mobilePhone) {
    const verification = await client.verify.v2

        .services('VA46a186f9b3e6525cbd272b461c25bae2')

        .verifications.create({
            channel: 'sms',

            to: mobilePhone,
        });

    logger.log(verification.status);
}

export async function verificationCheck(otpCode, mobilePhone) {
    const verificationCheck = await client.verify.v2

        .services('VA46a186f9b3e6525cbd272b461c25bae2')

        .verificationChecks.create({
            code: otpCode,

            to: mobilePhone,
        });

    logger.log(verificationCheck.status);
    return verificationCheck;
}
