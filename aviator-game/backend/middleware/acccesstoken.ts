import axios from 'axios';
import { Request, Response, NextFunction } from 'express';


const getAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    try {
        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );

        req.accessToken = response.data.access_token as string;
        console.log( "here is the accesstooken", req.accessToken);
        next();
    } catch (err) {
        console.error("Error fetching access token:", err);
        res.status(500).json({ error: "Failed to get access token" });
    }
};

export { getAccessToken };
