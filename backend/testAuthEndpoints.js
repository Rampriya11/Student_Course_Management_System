const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  invalid: { username: 'invalid', password: 'invalid', role: 'admin' }
};

async function testLoginEndpoint() {
  console.log('\n=== Testing /auth/login endpoint ===');

  // Test 1: Valid admin login
  try {
    console.log('Test 1: Valid admin login');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUsers.admin);
    console.log('✓ Success:', response.data.message);
    console.log('  Token length:', response.data.token.length);
    console.log('  User:', response.data.user.username, response.data.user.role);
    return response.data.token;
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testInvalidLogin() {
  console.log('\n=== Testing invalid login scenarios ===');

  // Test 2: Invalid credentials
  try {
    console.log('Test 2: Invalid credentials');
    await axios.post(`${BASE_URL}/auth/login`, testUsers.invalid);
    console.log('✗ Should have failed');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected invalid credentials');
    } else {
      console.log('✗ Unexpected error:', error.response?.data?.message);
    }
  }

  // Test 3: Missing fields
  try {
    console.log('Test 3: Missing password');
    await axios.post(`${BASE_URL}/auth/login`, { username: 'admin', role: 'admin' });
    console.log('✗ Should have failed');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Correctly rejected missing password');
    } else {
      console.log('✗ Unexpected error:', error.response?.data?.message);
    }
  }

  // Test 4: Invalid role
  try {
    console.log('Test 4: Invalid role');
    await axios.post(`${BASE_URL}/auth/login`, { username: 'admin', password: 'admin123', role: 'invalid' });
    console.log('✗ Should have failed');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Correctly rejected invalid role');
    } else {
      console.log('✗ Unexpected error:', error.response?.data?.message);
    }
  }
}

async function testChangePasswordEndpoint(token) {
  console.log('\n=== Testing /auth/change-password endpoint ===');

  if (!token) {
    console.log('Skipping change password tests - no valid token');
    return;
  }

  // Test 5: Valid password change
  try {
    console.log('Test 5: Valid password change');
    const response = await axios.post(`${BASE_URL}/auth/change-password`,
      { oldPassword: 'admin123', newPassword: 'newadmin123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Success:', response.data.message);
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.message || error.message);
  }

  // Test 6: Invalid old password
  try {
    console.log('Test 6: Invalid old password');
    await axios.post(`${BASE_URL}/auth/change-password`,
      { oldPassword: 'wrongpassword', newPassword: 'newadmin123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✗ Should have failed');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected invalid old password');
    } else {
      console.log('✗ Unexpected error:', error.response?.data?.message);
    }
  }

  // Test 7: Password too short
  try {
    console.log('Test 7: Password too short');
    await axios.post(`${BASE_URL}/auth/change-password`,
      { oldPassword: 'newadmin123', newPassword: '123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✗ Should have failed');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Correctly rejected short password');
    } else {
      console.log('✗ Unexpected error:', error.response?.data?.message);
    }
  }

  // Test 8: Unauthorized access
  try {
    console.log('Test 8: Unauthorized access (no token)');
    await axios.post(`${BASE_URL}/auth/change-password`,
      { oldPassword: 'admin123', newPassword: 'newadmin123' }
    );
    console.log('✗ Should have failed');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✓ Correctly rejected unauthorized access');
    } else {
      console.log('✗ Unexpected error:', error.response?.status, error.response?.data?.message);
    }
  }

  // Reset password back for future tests
  try {
    console.log('Resetting password back to admin123');
    await axios.post(`${BASE_URL}/auth/change-password`,
      { oldPassword: 'newadmin123', newPassword: 'admin123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Password reset successful');
  } catch (error) {
    console.log('✗ Password reset failed:', error.response?.data?.message);
  }
}

async function runTests() {
  console.log('Starting Authentication Endpoint Tests...');
  console.log('Make sure backend server is running on http://localhost:5000');

  try {
    const token = await testLoginEndpoint();
    await testInvalidLogin();
    await testChangePasswordEndpoint(token);

    console.log('\n=== Test Summary ===');
    console.log('Backend authentication endpoint tests completed.');
    console.log('Check the results above for any failures.');
  } catch (error) {
    console.error('Test runner error:', error.message);
  }
}

runTests();
