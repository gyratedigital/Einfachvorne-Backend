import { Router } from "express";
import { client } from "../config/clients/index.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const router = Router();
router.post('/create-account', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password || !first_name || !last_name) {
        res.status(400).send({ data: null, error: 'Missing required fields', user: null });
        return;
    }
    try {
        const existing = await client.users.findFirst({
            where: { email },
        });
        if (existing) {
            res.status(400).send({ data: null, error: 'User already exists', user: null });
            return;
        }
        const hashed = await bcrypt.hash(password, 10);
        const newUser = await client.users.create({
            data: { email, password: hashed, first_name, last_name, role: 'support' },
        });
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.status(200).send({ data: token, error: null, user: {
                first_name: newUser.first_name,
                email: newUser.email,
                type: newUser.role,
            } });
        return;
    }
    catch (error) {
        console.error('Error creating account:', error);
        res.status(500).send({ data: null, error: 'Internal Server Error', user: null });
    }
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).send({ data: null, error: 'Missing required fields', user: null });
        return;
    }
    try {
        const user = await client.users.findFirst({ where: { email } });
        if (!user) {
            res.status(400).send({ data: null, error: 'Invalid Email or Password', user: null });
            return;
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).send({ data: null, error: 'Invalid Email or Password', user: null });
            return;
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.status(200).send({ data: token, error: null, user: {
                first_name: user.first_name,
                email: user.email,
                type: user.role,
            } });
        return;
    }
    catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send({ data: null, error: 'Internal Server Error', user: null });
        return;
    }
});
export { router };
