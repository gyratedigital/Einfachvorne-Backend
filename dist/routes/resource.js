import { Router } from "express";
import { stripeClient } from "../config/clients/index.js";
const router = Router();
router.post("/cancel-subscription", async (req, res) => {
    console.log("POST: /cancel-subscription");
    const { email } = req.body;
    if (!email) {
        res.status(402).send({ data: null, error: "Email is missing" });
        return;
    }
    try {
        const customers = await stripeClient.customers.list({
            email: email,
        });
        console.log(customers.data, "customer");
        if (customers.data.length < 1) {
            res.status(400).send({ data: null, error: "No stripe customer found with this email" });
            return;
        }
        let options = { customer: customers.data[0].id.toString(), status: 'all' };
        const stripeData = await stripeClient.subscriptions.list(options);
        let stripeSubscriptions = stripeData.data;
        if (typeof stripeSubscriptions === 'object' && !Array.isArray(stripeSubscriptions)) {
            stripeSubscriptions = [stripeSubscriptions];
        }
        if (stripeSubscriptions && stripeSubscriptions.length > 0) {
            const active_subscription = stripeSubscriptions.find((e) => e.status === 'active' || e.status === 'past_due');
            if (active_subscription) {
                await stripeClient.subscriptions.cancel(active_subscription.id.toString());
                res.status(200).send({ data: "Subscription canceled successfully", error: null });
                return;
            }
            else {
                res.status(400).send({ data: null, error: "No active subscription found" });
                return;
            }
        }
        else {
            res.status(400).send({ data: null, error: "No active subscription found" });
            return;
        }
    }
    catch (error) {
        res.status(500).send({ data: null, error: "Internal Server Error" });
        return;
    }
});
export { router };
