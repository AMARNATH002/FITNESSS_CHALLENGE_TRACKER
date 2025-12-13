// Simple test to verify API endpoints
const axios = require('axios');

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://fitnesss-challenge-tracker.vercel.app/api'
  : 'http://localhost:3000/api';

async function testAPI() {
  console.log('Testing API at:', API_BASE);
  
  try {
    // Test basic API endpoint
    console.log('\n1. Testing basic API endpoint...');
    const testResponse = await axios.get(`${API_BASE}/test`);
    console.log('✅ API Test:', testResponse.data);
    
    // Test signup
    console.log('\n2. Testing signup...');
    const signupData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpass123',
      fitnessLevel: 'Beginner'
    };
    
    const signupResponse = await axios.post(`${API_BASE}/users/signup`, signupData);
    console.log('✅ Signup successful:', signupResponse.data.user.name);
    
    // Test login
    console.log('\n3. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      email: signupData.email,
      password: signupData.password
    });
    console.log('✅ Login successful:', loginResponse.data.user.name);
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testAPI();