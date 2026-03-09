/* ======================================================
   MODULO DE INVENTARIO - VARIABLES GLOBALES
======================================================*/

// Arreglo donde se almacenan los productos obtenidos del servidor
let inventory = [];

// Índice utilizado cuando se edita un producto
let editingIndex = -1;
//actualiza los productos mas vendidos
let salesChart = null;
//actualiza los productos mas movidos
let movementChart = null;


/* ======================================================
   MODULO DE CARGA DE DATOS (API)
   Obtiene los productos desde el servidor Node.js
======================================================*/

function loadData(){

fetch("/productos")
.then(res => res.json())
.then(data=>{

    console.log("Productos recibidos:", data);

    // Convertimos los datos del servidor a objetos manejables
    inventory = data.map(p => ({
        id: p.id,
        name: p.name,
        quantity: parseFloat(p.quantity),
        unit: p.unit,
        registerDate: p.registerDate,
        expiryDate: p.expiryDate,
        movements: parseInt(p.movements),
        sales: parseFloat(p.sales)
    }));

    // Actualizar panel principal
    updateDashboard();

})
.catch(err=>{
    console.error("Error cargando productos:",err);
});

}


/* ======================================================
   MODULO DE AUTENTICACIÓN (LOGIN / LOGOUT)
======================================================*/

// Evento al enviar formulario de login
document.getElementById('loginForm').addEventListener('submit',(e)=>{

    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Validación simple de usuario
    if(user==="admin" && pass==="123"){

        document.getElementById('loginContainer').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

        // Cargar inventario al iniciar sesión
        loadData();

    }else{
        document.getElementById('loginError').textContent="❌ Usuario o contraseña incorrectos";
    }

});

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click',()=>{

    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');

});


/* ======================================================
   MODULO DE REGISTRO Y EDICIÓN DE PRODUCTOS
======================================================*/

document.getElementById('addForm').addEventListener('submit',(e)=>{

e.preventDefault();

// Obtener datos del formulario
const name = document.getElementById('productName').value.trim();
const quantity = parseFloat(document.getElementById('quantity').value);
const unit = document.getElementById('unit').value;
const registerDate = document.getElementById('registerDate').value;
const expiryDate = document.getElementById('expiryDate').value;

const errorBox = document.getElementById('formError');
errorBox.textContent="";


/* ================= VALIDACIONES ================= */

if(!name || !unit || !registerDate || !expiryDate){
errorBox.textContent="⚠️ Todos los campos son obligatorios";
return;
}

if(isNaN(quantity) || quantity<=0){
errorBox.textContent="⚠️ Cantidad inválida";
return;
}

if(new Date(expiryDate)<=new Date(registerDate)){
errorBox.textContent="⚠️ Caducidad inválida";
return;
}


// Objeto producto
const product={
name,
quantity,
unit,
registerDate,
expiryDate,
movements:0,
sales:0
};


/* ================= EDITAR PRODUCTO ================= */

if(editingIndex>=0){

const id = inventory[editingIndex].id;

fetch(`/productos/${id}`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(product)
})
.then(()=>loadData());

editingIndex=-1;
document.querySelector('#addForm button').textContent="Agregar";

}else{

/* ================= AGREGAR PRODUCTO ================= */

fetch("/productos",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(product)
})
.then(()=>loadData());

}

document.getElementById('addForm').reset();

});


/* ======================================================
   MODULO DE BUSQUEDA DE PRODUCTOS
======================================================*/

function filterTable(){

const search=document.getElementById('searchInput').value.toLowerCase();

const filtered = inventory.filter(item=>
item.name.toLowerCase().includes(search)
);

renderRows(filtered);

}

document.getElementById('searchInput').addEventListener('input',filterTable);


/* ======================================================
   MODULO DASHBOARD (ESTADISTICAS)
======================================================*/

function updateDashboard(){

// Total productos registrados
document.getElementById('totalProducts').textContent=inventory.length;

// Stock total
const totalStock = inventory.reduce((sum,item)=>sum+item.quantity,0);
document.getElementById('totalStock').textContent=totalStock.toFixed(1);

// Alerta de stock bajo
const low = inventory.some(item=>item.quantity<10);
document.getElementById('lowStockAlert').classList.toggle('hidden',!low);

// Actualizar tabla
filterTable();

renderSalesChart();

renderMovementChart();



}


/* ======================================================
   MODULO TABLA DE INVENTARIO
======================================================*/

function renderRows(data){

console.log("Renderizando tabla:", data);

const tbody = document.getElementById('tableBody');
tbody.innerHTML="";

const today=new Date();

data.forEach(item=>{

const index = inventory.indexOf(item);
const expiry = new Date(item.expiryDate);

// Estado del producto
let status="✅ OK";

if(expiry<=today) status="❌ Caducado";
else if(item.quantity<10) status="⚠️ Bajo";

// Crear fila
const row=document.createElement('tr');

row.innerHTML=`

<td>${item.name}</td>
<td>${item.quantity}</td>
<td>${item.unit}</td>
<td>${new Date(item.registerDate).toLocaleDateString('es-EC')}</td>
<td>${new Date(item.expiryDate).toLocaleDateString('es-EC')}</td>
<td>${status}</td>
<td>${item.movements}</td>
<td>${item.sales}</td>

<td>
<button onclick="addStock(${index})">Entrada</button>
<button onclick="removeStock(${index})">Salida</button>
<button onclick="editItem(${index})">Editar</button>
<button onclick="deleteItem(${index})">Eliminar</button>
</td>

`;

tbody.appendChild(row);

});

}


/* ======================================================
   MODULO EDICIÓN DE PRODUCTO
======================================================*/

function editItem(index){

const item=inventory[index];

document.getElementById('productName').value=item.name;
document.getElementById('quantity').value=item.quantity;
document.getElementById('unit').value=item.unit;
document.getElementById('registerDate').value=item.registerDate;
document.getElementById('expiryDate').value=item.expiryDate;

editingIndex=index;

document.querySelector('#addForm button').textContent="Actualizar";

window.scrollTo(0,0);

}


/* ======================================================
   MODULO ELIMINAR PRODUCTO
======================================================*/

function deleteItem(index){

const id = inventory[index].id;

if(confirm(`¿Eliminar ${inventory[index].name}?`)){

fetch(`/productos/${id}`,{
method:"DELETE"
})
.then(()=>loadData());

}

}


/* ======================================================
   MODULO MOVIMIENTO DE INVENTARIO
======================================================*/

// Entrada de stock
function addStock(index){

const amount = parseFloat(prompt("Cantidad a ingresar:"));

if(isNaN(amount)||amount<=0){
alert("Cantidad inválida");
return;
}

const id = inventory[index].id;

fetch(`/productos/${id}/entrada`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({amount})
})
.then(()=>loadData());

}


// Salida o venta de producto
function removeStock(index){

const amount=parseFloat(prompt("Cantidad a retirar:"));

if(isNaN(amount)||amount<=0){
alert("Cantidad inválida");
return;
}

const id = inventory[index].id;

fetch(`/productos/${id}/salida`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({amount})
})
.then(()=>loadData());

}


/* ======================================================
   MODULO REPORTES
======================================================*/

// Producto con mayor movimiento
function getTopProduct(){

fetch("/productos/top-movimientos")
.then(res=>res.json())
.then(top=>{

alert(`📈 Producto con más movimiento:
${top.name}
Movimientos: ${top.movements}`);

});

}


// Producto más vendido
function getTopSellingProduct(){

fetch("/productos/top-ventas")
.then(res=>res.json())
.then(top=>{

alert(`🏆 Producto más vendido:
${top.name}
Cantidad vendida: ${top.sales}`);

});

}


/* ======================================================
   MODULO CALCULADORA DE PRECIOS
======================================================*/

function calculateSellingPrice(){

const cost = parseFloat(document.getElementById("calcCost").value);
const margin = parseFloat(document.getElementById("calcMargin").value);

if(isNaN(cost) || isNaN(margin)){
document.getElementById("calcResult").textContent = "$0.00";
document.getElementById("calcProfit").textContent = "$0.00";
return;
}

const sellingPrice = cost + (cost * margin / 100);
const profit = sellingPrice - cost;

document.getElementById("calcResult").textContent = "$" + sellingPrice.toFixed(2);
document.getElementById("calcProfit").textContent = "$" + profit.toFixed(2);

}

//Modulos de productos mas vendido
function renderSalesChart(){

// ordenar productos por ventas
const sorted = [...inventory].sort((a,b)=> b.sales - a.sales);

// tomar los 5 más vendidos
const topProducts = sorted.slice(0,5);

const labels = topProducts.map(p => p.name);
const sales = topProducts.map(p => p.sales);

const ctx = document.getElementById('salesChart');

// si el grafico ya existe lo destruimos
if(salesChart){
salesChart.destroy();
}

salesChart = new Chart(ctx, {

type: 'bar',

data: {
labels: labels,
datasets: [{
label: 'Productos vendidos',
data: sales
}]
},

options: {
responsive: true,
plugins: {
legend: {
display: false
}
}
}

});

}

//modulo producto mas movido
function renderMovementChart(){

// ordenar por movimientos
const sorted = [...inventory].sort((a,b)=> b.movements - a.movements);

// tomar los 5 con más movimientos
const topProducts = sorted.slice(0,5);

const labels = topProducts.map(p => p.name);
const movements = topProducts.map(p => p.movements);

const ctx = document.getElementById('movementChart');

// destruir grafico si existe
if(movementChart){
movementChart.destroy();
}

movementChart = new Chart(ctx,{

type:'bar',

data:{
labels:labels,
datasets:[{
label:'Movimientos',
data:movements
}]
},

options:{
responsive:true,
plugins:{
legend:{
display:false
}
}
}

});

}





/* ======================================================
   MODULO GENERACIÓN DE REPORTES PDF
======================================================*/

function downloadInventoryPDF(){

const { jsPDF } = window.jspdf;
const doc = new jsPDF();

doc.setFontSize(18);
doc.text("Inventario - Verdulería Jipijapa", 14, 20);

doc.setFontSize(11);
doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 28);

// Columnas
const columns = [
"Producto",
"Cantidad",
"Unidad",
"Fecha Registro",
"Fecha Caducidad",
"Estado",
"Movimientos",
"Ventas"
];

// Filas
const rows = inventory.map(item => {

const today = new Date();
const expiry = new Date(item.expiryDate);

let status = "OK";

if(expiry <= today) status = "Caducado";
else if(item.quantity < 10) status = "Stock Bajo";

return [
item.name,
item.quantity,
item.unit,
new Date(item.registerDate).toLocaleDateString(),
new Date(item.expiryDate).toLocaleDateString(),
status,
item.movements,
item.sales
];

});

// Crear tabla
doc.autoTable({
head: [columns],
body: rows,
startY: 35
});

// Descargar archivo
doc.save("inventario-verduleria.pdf");

}
