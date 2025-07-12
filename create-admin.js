const bcrypt = require('bcryptjs');

// Simple admin user creation
const adminData = {
    username: 'admin',
    email: 'admin@walmart.com',
    password: 'admin123',
    role: 'admin'
};

console.log('Admin credentials:');
console.log('Username:', adminData.username);
console.log('Password:', adminData.password);
console.log('Email:', adminData.email);
console.log('\nYou can use these credentials to log in as admin.');
console.log('The admin user will be created when you first access the admin dashboard.');