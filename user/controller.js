export { printHello };

function printHello(req, resp) {
    console.log('Hello user ');
    resp.status(200).send('Now in user section');
}
