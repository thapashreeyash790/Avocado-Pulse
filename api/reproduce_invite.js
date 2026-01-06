const fetch = require('node-fetch');

async function testInvite() {
    try {
        const response = await fetch('http://localhost:4000/api/team/invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test Setup User',
                email: 'test_invite_user@example.com',
                role: 'TEAM',
                permissions: { billing: true, projects: true, timeline: true, management: false }
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testInvite();
