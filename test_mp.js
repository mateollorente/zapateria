const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN, options: { timeout: 5000 } });
const preference = new Preference(client);

async function run() {
  try {
    const prefResponse = await preference.create({
      body: {
        items: [
            {
               id: '123',
               title: 'Test',
               quantity: 1,
               unit_price: 100, // Important, must be Number
            }
        ],
        external_reference: 'order-123',
        back_urls: {
          success: 'http://127.0.0.1:3000/orders',
          pending: 'http://127.0.0.1:3000/orders',
          failure: 'http://127.0.0.1:3000/cart',
        },
        auto_return: "approved",
      }
    });
    console.log('Success:', prefResponse.id);
  } catch (error) {
    console.log('Got expected local error:', error.message);
  }
}
run();
