let arrayMonedas = [];
let transaccionesUsuario = [];
let datosDepartamentos = [];
var map;
const baseURL = 'https://crypto.develotion.com/';

document.addEventListener('DOMContentLoaded', function () {
    // lo que tiene el tag ion-router
    let router = document.querySelector('ion-router');
    
    router.addEventListener('ionRouteDidChange', function (e) {
        
        // cierro menú
        document.getElementById('menu_lateral').close();

        let nav = e.detail;
        let paginas = document.getElementsByTagName('ion-page');

        for (let i = 0; i < paginas.length; i++) {
            paginas[i].style.visibility = "hidden";
        }

        let ion_route = document.querySelectorAll(`[url="${nav.to}"]`)
        let id_pagina = ion_route[0].getAttribute('component');
        let pagina = document.getElementById(id_pagina);
        pagina.style.visibility = "visible";


        if(nav.to == "/registro"){
            limpiarDatosRegistro();
        }else if(nav.to == "/monedas"){
            obtenerMonedas();
            obtenerTransacciones();
        } else if(nav.to == "/transaccion"){
            obtenerMonedas();
            pantallaTransaccion();
        } else if(nav.to == "/transacciones"){
            obtenerMonedas();
        } else if(nav.to == "/inversiones"){
            calcularTotalInversiones();
        } else if(nav.to == "/mapa"){
            obtenerTransacciones();
            obtenerDatosDepartamentos();
            obtenerUsuariosPorDepartamento();
        } else if(nav.to == "/compras"){
            obtenerMonedas();
            obtenerTotalInvertidoPorMoneda();
        } 
        else if(nav.to == "/saludo"){
            patallaSaludo();
        }
    });

    // LOGIN
    document.getElementById('btn_login').onclick = function () {
        const usuario = document.getElementById('inp_usuario').value;
        const password = document.getElementById('inp_password').value;
        localStorage.setItem("nombreUsuario", usuario);
        try {
            if (!usuario) {
                throw 'Usuario requerido';
            }
            if (!password) {
                throw 'Contraseña requerida';
            }
            //invocar API de login de usuario.
            const url = `${baseURL}login.php`;
            fetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    usuario: usuario,
                    password: password
                }),
                headers: {
                    "Content-type": "application/json"
                }
            }).then(respuesta => (respuesta.ok) ? respuesta.json() : respuesta.json().then(data => Promise.reject(data.error)))
                .then(data => login(data, router))
                .catch(mensaje => display_toast('Ha ocurrido un problema', 'warning'))

        }
        catch (e) {
            display_toast(e,'warning');
        }
    };

    document.getElementById('btn_relogin').onclick = function (){
        router.push('/')
    }

    //REGISTRO
    document.getElementById('btn_registro').onclick = function () {
        try {
            const usuario = document.getElementById('inp_usuario_registro').value;
            const password = document.getElementById('inp_pass_registro').value;
            const repassword = document.getElementById('inp_repass_registro').value;
            let departamento = document.getElementById('select_ndepartamento').value;
            const ciudad = document.getElementById('select_options').value;

            if (!usuario) {
                throw 'Usuario requerido para continuar';
            }
            if (!password) {
                throw 'Debe introducir una contraseña';
            }
            if (!departamento) {
                throw 'Departamento requerido para continuar';
            }
            if (!ciudad) {
                throw 'Ciudad requerida para continuar';
            }
            if (password != repassword) {
                throw 'Las contraseñas deben ser iguales';
            }

            //post a API registro de usuario
            const url = `${baseURL}usuarios.php`;
            const datos = {
                "usuario": usuario,
                "password": password,
                "idDepartamento": departamento,
                "idCiudad": ciudad
            }
            fetch(url, {
                method: 'POST',
                body: JSON.stringify(datos),
                headers: {
                    "Content-type": "application/json"
                }
            }).then(respuesta => (respuesta.ok) ? respuesta.json() : respuesta.json().then(data => Promise.reject(data.error)))
                .then(router.push('/'))
                .catch(data => {
                    display_toast('Ha ocurrido un error', 'warning')
                    limpiarDatosRegistro();
                })
        }
        catch (e) {
            display_toast(e, 'warning');
        }
    }

    // Obtengo la opción seleccionada en el select de DEPARTAMENTOS
    const select = document.getElementById('select_departamento');
    select.addEventListener('ionChange', e => {
        const departamento = e.detail.value;

        // según el depto seleccionado cargo las ciudades
        const url = `${baseURL}ciudades.php?idDepartamento=${departamento}`;
        fetch(url, {
            headers: {
                "Content-type": "application/json"
            }
        }).then(respuesta => respuesta.json())
            .then(data => cargarCiudades(data))
    });

    function obtenerMonedas() {
        cargando('Cargando datos...').then((loading) => {
            loading.present();
            let token = localStorage.getItem("token");
            const url = `${baseURL}monedas.php`;
            fetch(url, {
                method: 'GET',
                headers: {
                    "apiKey": token,
                    "Content-Type": "application/json"
                }
            }).then(respuesta => respuesta.json())
                .then(data => crearListadoMonedas(data))
                .catch(error => display_toast(error, 'warning'))
                .finally(() => loading.dismiss());
        });
    }

    // REALIZAR TRANSACCION
    document.getElementById('btn_transaccion').onclick = function(){
        try{
            const url = `${baseURL}transacciones.php`;
            const token = localStorage.getItem('token');
            const idUsuario = localStorage.getItem('idUsuario');
            const idMoneda = getParam('id');
            const cotizacion = getParam('coti');
            const tipoOperacion = document.getElementById('select_compra_venta').value;
            const cantUnidades = document.getElementById('inp_unidades').value;

            if(!tipoOperacion){
                throw 'Seleccione tipo operación para continuar';
            }
            if(!cantUnidades){
                throw 'Ingrese cantidad de unidades';
            }
            if(cantUnidades < 1){
                throw 'La cantidad de unidades debe ser mayor que cero';
            }

            let datos = {
                "idUsuario": Number(idUsuario),
                "tipoOperacion": Number(tipoOperacion),
                "moneda": Number(idMoneda),
                "cantidad": Number(cantUnidades),
                "valorActual": Number(cotizacion)
            }
            datos = JSON.stringify(datos);
            fetch(url, {
                method:'POST',
                body: datos,
                headers:{
                    "apikey": token,
                    "Content-type":"application/json"
                }
            }).then(respuesta => (respuesta.ok) ? respuesta.json() : respuesta.json().then(data => Promise.reject(data.error)))
            .then(data => {
                presentAlert(data.mensaje);
                limpiarPantallaTransaccion();
                router.push('/monedas');
            })
            .catch(data => display_toast(data.mensaje,'warning'))

        }catch(e){
            display_toast(e,'warning');
        }
    }

    // FILTRO TRANSACCIONES POR MONEDA
    document.getElementById('btn_filtrar').onclick = function () {

        // vacío la lista de todas las transacciones
        let lista = document.getElementById('lista_transacciones');
        lista.innerHTML = '';

        const idMoneda = document.getElementById('select_monedas_usuario').value;
        
        try {
            if (!idMoneda) {
                throw 'Debe seleccionar la moneda para filtrar';
            }
            
            let transaccionesUsuarioPorMoneda = [];
            transaccionesUsuarioPorMoneda = filtrarTransaccionesPorMoneda(transaccionesUsuario, idMoneda);
            transaccionesUsuarioPorMoneda.length > 0 ? transaccionesUsuarioPorMoneda.forEach((transaccion) => {
                item =
                    `<ion-item class="item-menu">
                        <ion-icon name="caret-forward-outline"></ion-icon>
                        <ion-label>
                            <h2>&nbsp;&nbsp${arrayMonedas.find(item => item.id == transaccion.moneda)?.nombre}</h2>
                            <h3>&nbsp;&nbspTipo transacción: ${transaccion.tipo_operacion == 1 ? "Compra" : "Venta"}</h3>
                            <h3>&nbsp;&nbspCantidad unidades: ${transaccion.cantidad}</h3>
                            <h3>&nbsp;&nbspValor: ${transaccion.valor_actual}</h3>
                        </ion-label>
                    </ion-item>`
                ;
                lista.innerHTML += item;
            }):  lista.innerHTML += `
                    <ion-item class="item-menu">
                        <ion-label>
                            <h1><strong>No tiene transacciones</strong></h1>
                        </ion-label>
                    </ion-item>`;

        }
        catch (e) {
            display_toast(e,'warning');
        }
    };

    //LOGOUT
    document.getElementById('btn_logout').onclick = function () {
        localStorage.setItem("idUsuario",null);
        localStorage.setItem("token",null);
        localStorage.setItem("nombreUsuario",null);

        router.push("/saludo");
    }

});

function patallaSaludo(){

    let usuario = localStorage.getItem('nombreUsuario');
    let texto = document.getElementById('txt-bienvenida');
    const token = localStorage.getItem('idUsuario');

    texto.innerHTML = `<h1>Hola, podés inciar sesión o registrarte aquí</h1>`;
    
}

// guardamos los datos del usuario en localStorage
function login(data, router) {
    localStorage.setItem("idUsuario", JSON.stringify(data.id));
    localStorage.setItem("token", data.apiKey);
    const user = localStorage.getItem("nombreUsuario");
    
    // verificarUsuarioLogueado(router);
    router.push('/monedas');
    display_toast(`Hola ${user}`, "success")
}

function limpiarDatosRegistro() {
    document.getElementById('inp_usuario_registro').value = '';
    document.getElementById('inp_pass_registro').value = '';
    document.getElementById('inp_repass_registro').value = '';
}

function obtenerTransacciones() {
    cargando('Cargando datos...').then((loading) => {
        loading.present();
        let idUsuario = localStorage.getItem("idUsuario");
        let token = localStorage.getItem("token");
        const url = `${baseURL}transacciones.php?idUsuario=${idUsuario}`;
        fetch(url, {
            headers: {
                "apiKey": token,
                "Content-Type": "application/json"
            }
        }).then(respuesta => respuesta.json())
            .then(data => crearListadoTransacciones(data))
            .catch(error => display_toast(error, 'warning'))
            .finally(() => loading.dismiss());
    });
}

function cargarCiudades(data) {
    let options = "";
    let lista = document.getElementById('select_options');

    data.ciudades.forEach(function (ciudad) {
        options = `<ion-select-option value="${ciudad.id}">${ciudad.nombre}</ion-select-option>`;
        lista.innerHTML += options;
    });
}

function crearListadoMonedas(data) {

    let lista = document.getElementById('lista_monedas');
    lista.innerHTML = '';
    let item = '';
    arrayMonedas = data.monedas;

    arrayMonedas.forEach((moneda) => {        
        const nombreMoneda = moneda.nombre;
        const cotizacion = moneda.cotizacion;

        item =
            `<ion-item href="/transaccion?id=${moneda.id}&coti=${cotizacion}&nom=${nombreMoneda}" >
                <ion-avatar slot="start">
                    <img src="https://crypto.develotion.com/imgs/${moneda.imagen}" />
                </ion-avatar>
                <ion-label>
                    <h2>${nombreMoneda}</h2>
                    <h3>Cotización: ${cotizacion}</h3>
                </ion-label>
            </ion-item>`
        ;
        lista.innerHTML += item;
    });
}

function crearListadoTransacciones(data){
    transaccionesUsuario = data.transacciones;

    // cargo el select con monedas para filtro
    let options = "";
    let listaMonedas = document.getElementById('select_monedas_usuario');
    arrayMonedas.forEach((moneda) => {
        options = `<ion-select-option value="${moneda.id}">${moneda.nombre}</ion-select-option>`;
        listaMonedas.innerHTML += options;
    });
    
    // listo todas las transacciones del usuario
    let lista = document.getElementById('lista_transacciones');
    lista.innerHTML = '';
    let item = '';
    transaccionesUsuario.length > 0 || data.transacciones == undefined  ? transaccionesUsuario.forEach((transaccion) => {
        item =
            `<ion-item class="item-menu">
                <ion-icon name="caret-forward-outline"></ion-icon>
                <ion-label>
                    <h2>&nbsp;&nbsp${arrayMonedas.find(item => item.id == transaccion.moneda)?.nombre}</h2>
                    <h3>&nbsp;&nbspTipo transacción: ${transaccion.tipo_operacion == 1 ? "Compra" : "Venta"}</h3>
                    <h3>&nbsp;&nbspCantidad unidades: ${transaccion.cantidad}</h3>
                    <h3>&nbsp;&nbspValor: ${transaccion.valor_actual}</h3>
                </ion-label>
            </ion-item>`
        ;
        lista.innerHTML += item;
    }):  lista.innerHTML += `
            <ion-item class="item-menu">
                <ion-label>
                    <h1><strong>Aún no tiene transacciones</strong></h1>
                </ion-label>
            </ion-item>`;
}

// CARGO DATOS PANTALLA TRANSACCION
function pantallaTransaccion(){
    const nombreMoneda = getParam('nom');
    const cotizacion = getParam('coti');

    document.getElementById('crypto_seleccionada').innerHTML = `<strong>${nombreMoneda}</strong>`;
    document.getElementById('cotizacion').innerHTML = `<strong>${cotizacion}</strong>`;
}

function limpiarPantallaTransaccion(){
    document.getElementById('inp_unidades').value = '';
}

// devuelvo las transacciones del user logueado según la moneda del filtro
function filtrarTransaccionesPorMoneda(transaccionesUsuario, idMoneda){
    return transacciones = transaccionesUsuario.filter(transaccion => transaccion.moneda == idMoneda);
}

function calcularTotalInversiones(){

    let compras = transaccionesUsuario.filter(transaccion => transaccion.tipo_operacion == 1)
    let ventas = transaccionesUsuario.filter(transaccion => transaccion.tipo_operacion == 2)
    let totalCompras = 0;
    let totalVentas = 0;
    let montoTotal = 0;
    let totalPesos = 0;

    compras.forEach((compra) => {
        let montoCompra = compra.cantidad * compra.valor_actual;
        totalCompras += montoCompra;
    });

    ventas.forEach((venta) => {
        let montoVenta = venta.cantidad * venta.valor_actual;
        totalVentas += montoVenta;
    });

    montoTotal = totalCompras - totalVentas;
    // lo paso a pesos
    totalPesos = montoTotal / 41;
    let pesos = Intl.NumberFormat('de-DE');

    // TODO: mostrar el valor si es negativo
    document.getElementById('monto_invertido').innerHTML = `<strong>$${pesos.format(totalPesos)}</strong>`;

}

// mostrar para cada moneda el dinero total invertido en compras ($U, y solo para el usuario logueado).
function obtenerTotalInvertidoPorMoneda(){

    let totalesPorMoneda = new Map();

    transaccionesUsuario.forEach((compra) => {
        if(compra.tipo_operacion == 1) {
            let nombreMoneda = obtenerNombreMonedaPorId(compra.moneda); // monereum
            let aux = {
                id: compra.moneda,
                nombre: nombreMoneda,
                valor_actual: compra.valor_actual,
                monto_venta: 0
            }
            // multiplico la cantidad por el valor de la moneda
            let montoVentaDolares = (compra.cantidad * compra.valor_actual);
            let montoVentaPesos = montoVentaDolares / 41;
            
            let montoVentaPesosFormat = Intl.NumberFormat('de-DE').format(montoVentaPesos);

            // si ya existe la moneda en el map acumulo el monto
            if(totalesPorMoneda.has(nombreMoneda)) {
                aux.monto_venta = totalesPorMoneda.get(nombreMoneda).monto_venta + montoVentaPesosFormat;
                totalesPorMoneda.set(nombreMoneda, aux)
            } else { // si no existe asigno el montoVentaPesosFormat
                aux.monto_venta = montoVentaPesosFormat
                totalesPorMoneda.set(nombreMoneda, aux)
            }
        }
    })

    const totalInvertidoPorMoneda = Array.from(totalesPorMoneda, ([name, value]) => ({ name, value }));

    let lista = document.getElementById('lista_compras');
    lista.innerHTML = '';
    let item = '';
    totalInvertidoPorMoneda.length > 0 ? totalInvertidoPorMoneda.forEach((compra) => {
        item =
            `<ion-item class="item-menu">
                <ion-icon name="caret-forward-outline"></ion-icon>
                <ion-label>
                    <h2>&nbsp;&nbspMoneda:<strong> ${compra.value.nombre}</strong></h2>
                    <h2>&nbsp;&nbspID: ${compra.value.id}</h2>            
                    <h2>&nbsp;&nbsp$ ${compra.value.monto_venta}</h2>
                </ion-label>
            </ion-item>`
        ;
        lista.innerHTML += item;
    }):  lista.innerHTML += `
            <ion-item class="item-menu">
                <ion-label>
                    <h1><strong>Aún no tiene transacciones</strong></h1>
                </ion-label>
            </ion-item>`;
    
    
}

// #region MAPA
// obtengo detalles departamentos
function obtenerDatosDepartamentos(){

    const url = `${baseURL}departamentos.php`;
    
    fetch(url, {
        headers:{
            "Content-Type": "application/json"
        }
    }).then(respuesta => respuesta.json())
    .then(data => datosDepartamentos = data.departamentos);
}

// obtengo cantidad de usuarios por departamento
function obtenerUsuariosPorDepartamento(){
    cargando('Cargando datos...').then((loading) => {
        loading.present();

        let token = localStorage.getItem("token");
        const url = `${baseURL}usuariosPorDepartamento.php`;
        
        fetch(url, {
            headers:{
                "apikey": token,
                "Content-Type": "application/json"
            }
        }).then(respuesta => respuesta.json())
        .then(data => mostrarMapa(data))
        .catch(data => display_toast(data.mensaje, 'warning'))
        .finally(() => loading.dismiss());
    });
}

function mostrarMapa(data){

    obtenerTransacciones();
    datosDepartamentos;
    let usuariosPorDptos = data.departamentos;

    if(map != undefined){
        map.remove();
    }

    map = L.map('map').setView([-33.38157816896209, -56.527472033437874], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);


    usuariosPorDptos.forEach((dato) => {
        let deptoBuscado = datosDepartamentos.find(item => item.id == dato.id)
        
        L.marker([deptoBuscado.latitud, deptoBuscado.longitud]).addTo(map)
        .bindPopup(`<strong>${deptoBuscado.nombre}</strong><br/>Usuarios: ${dato.cantidad_de_usuarios}`)
        .openPopup();
    })
  
}

//#endregion

//#region UTILIDADES
function display_toast(header, color) {
    const toast = document.createElement('ion-toast');
    toast.header = header;
    toast.icon = 'information-circle',
    toast.position = 'top';
    toast.message = "";
    toast.duration = 3000;
    toast.color = color;
    document.body.appendChild(toast);
    toast.present();
}

async function cargando(message) {
    const loading = await loadingController.create({
        message: message,
    });
    return await loading;
}

// para `obtener` un parámetro específico de la URL
function getParam(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

async function presentAlert(header, sub_header, message) {
    const alert = document.createElement('ion-alert');
    alert.header = header;
    alert.subHeader = sub_header;
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    await alert.present();
}

function obtenerNombreMonedaPorId(id){
    return nombre = arrayMonedas.find(item => item.id == id)?.nombre
}

//#endregion UTILIDADES
