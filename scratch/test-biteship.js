const fetch = require('node-fetch');

async function check() {
  const payload = {
      origin_postal_code: "55283",
      destination_postal_code: "50661",
      couriers: "jne,jnt,sicepat,gojek,grab",
      items: [
        {
          name: "Test",
          description: "Test",
          value: 10000,
          length: 10,
          width: 10,
          height: 10,
          weight: 1000,
          quantity: 1
        }
      ]
  };

  const response = await fetch("https://api.biteship.com/v1/rates/couriers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiWU1DQyBWSUkiLCJ1c2VySWQiOiI2YTJhNmNhNDc1NjUzMTEwMGEwN2YwZGIiLCJpYXQiOjE3ODExNjU0NDN9.9g4v5k3EXx8h6BpNGxCtKG7wu90d2TLyEX7xqU_lzcQ"
    },
    body: JSON.stringify(payload)
  });
  
  console.log(await response.json());
}
check();


