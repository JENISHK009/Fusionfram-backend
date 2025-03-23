import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    }
}, {
    timestamps: true,
    versionKey: false
});

const Role = mongoose.model('Role', roleSchema);

// Add default roles (admin and user) if they don't exist
const createDefaultRoles = async () => {
    try {
        const roles = await Role.find();
        if (roles.length === 0) {
            await Role.create([{ name: 'admin' }, { name: 'user' }]);
            console.log('Default roles created successfully.');
        }
    } catch (error) {
        console.error('Error creating default roles:', error);
    }
};

createDefaultRoles();

export default Role;