import db from '../models/index.js';

export async function getUserProfilePic(userId) {
    const user = await db.users.findUserById({ id: userId });
    if (user && user.userProfilePic) {
        return user.userProfilePic;
    }
    // Fallback: search in auth-providers table
    const provider = await db.auth_providers.findOne({ where: { userId } });
    if (provider && provider.photoUrl) {
        return provider.photoUrl;
    }
    return null;
}
