import express from 'express';
import ChatUser from '../models/ChatUser.js';
import bcrypt from 'bcryptjs';


const router = express.Router();

router.post('/login', async(req, res) => {
    const {username, password} = req.body;
    const user = await ChatUser.findOne({username});
    if(!user) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new ChatUser({
                username,
                password: hashedPassword,
            });
            await newUser.save();
            return res.status(201).json({ message: 'User created successfully', username: username });
        } catch(erro) {
            res.status(504).json({message: 'server error'})
        }
    } else {
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send('Incorrect Password');
    res.status(200).json({ message: 'Login successful', username: username });
    }
})

export default router;