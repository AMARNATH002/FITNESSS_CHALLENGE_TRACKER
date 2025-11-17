const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3001/api/users/login', {
      email: 'test@example.com',
      password: 'testpass123'
    });
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testLogin();
