import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({}, { strict: false });
export default mongoose.models.User || mongoose.model('User', userSchema, 'users'); 