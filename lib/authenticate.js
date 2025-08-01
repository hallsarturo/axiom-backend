// Middleware to extract user from token (reuse your logic)
export default async function authenticate(req, res, next) {
    console.log('reached authenticate 1');
    let token;
    if (process.env.NODE_ENV === 'production') {
        token = req.cookies.token;
    } else {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else {
            token = req.cookies.token;
        }
    }
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const payload = jwt.verify(token, 'secret');
        // Find user in the db by id
        const user = await db.users.findUserById({ id: payload.id });
        console.log('user: ', user);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('reached authenticate 2');
        req.userId = payload.id;
        next();
        console.log('reached authenticate 3');
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
