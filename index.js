//Importamos Express tras instalarlo vía NPM
var express = require('express');
var App = express();

// Definimos algunas variables que usaremos en las distintas funciones
const port = process.env.PORT || 3000;

const options = {
  root: __dirname
}

// Definimos funciones para luego usarlas al recibir una petición en el router
function getHTML() {
  console.log("hola");
}

// Definimos las rutas
App.get('/', getHTML)

// Escuchamos el puerto de Express
App.listen(port, () => {
  console.log('Aplicacion escuchando en el puerto: ' + port)
})