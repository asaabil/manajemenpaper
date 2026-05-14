
import axios from 'axios';

const testRegistration = async () => {
  try {
    const response = await axios.post('http://localhost:4000/api/v1/auth/register', {
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
      role: 'mahasiswa'
    });
    console.log('Success:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error Message:', error.message);
    }
  }
};

testRegistration();
