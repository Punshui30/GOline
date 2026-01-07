const fetch = require('node-fetch');

async function testApi() {
    try {
        const response = await fetch('http://localhost:3000/api/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "I want to relax but stay focused" })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.status === 200) {
            console.log('SUCCESS: API is working correctly.');
        } else {
            console.log('FAILURE: API returned error.');
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testApi();
