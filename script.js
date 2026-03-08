
// INVENTARIO
let inventory = [];
let editingIndex = -1;

function loadData(){

fetch("/productos")
.then(res => res.json())
.then(data=>{

    console.log("Productos recibidos:", data);

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

    updateDashboard();

})
.catch(err=>{
    console.error("Error cargando productos:",err);
});

}

// LOGIN
document.getElementById('loginForm').addEventListener('submit',(e)=>{
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if(user==="admin" && pass==="123"){
        document.getElementById('loginContainer').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadData();
    }else{
        document.getElementById('loginError').textContent="❌ Usuario o contraseña incorrectos";
    }
});

document.getElementById('logoutBtn').addEventListener('click',()=>{
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
});

// AGREGAR / EDITAR PRODUCTO
document.getElementById('addForm').addEventListener('submit',(e)=>{

e.preventDefault();

const name = document.getElementById('productName').value.trim();
const quantity = parseFloat(document.getElementById('quantity').value);
const unit = document.getElementById('unit').value;
const registerDate = document.getElementById('registerDate').value;
const expiryDate = document.getElementById('expiryDate').value;

const errorBox = document.getElementById('formError');
errorBox.textContent="";

// VALIDACIONES
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

const product={
name,
quantity,
unit,
registerDate,
expiryDate,
movements:0,
sales:0
};

// EDITAR PRODUCTO
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

// AGREGAR PRODUCTO
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

// BUSCADOR
function filterTable(){

const search=document.getElementById('searchInput').value.toLowerCase();

const filtered = inventory.filter(item=>
item.name.toLowerCase().includes(search)
);

renderRows(filtered);

}

document.getElementById('searchInput').addEventListener('input',filterTable);

// DASHBOARD
function updateDashboard(){

document.getElementById('totalProducts').textContent=inventory.length;

const totalStock = inventory.reduce((sum,item)=>sum+item.quantity,0);

document.getElementById('totalStock').textContent=totalStock.toFixed(1);

const low = inventory.some(item=>item.quantity<10);

document.getElementById('lowStockAlert').classList.toggle('hidden',!low);

filterTable();

}

// TABLA
function renderRows(data){

console.log("Renderizando tabla:", data);

const tbody = document.getElementById('tableBody');
tbody.innerHTML="";

const today=new Date();

data.forEach(item=>{

const index = inventory.indexOf(item);
const expiry = new Date(item.expiryDate);

let status="✅ OK";

if(expiry<=today) status="❌ Caducado";
else if(item.quantity<10) status="⚠️ Bajo";

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

// EDITAR
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

// ELIMINAR
function deleteItem(index){

const id = inventory[index].id;

if(confirm(`¿Eliminar ${inventory[index].name}?`)){

fetch(`/productos/${id}`,{
method:"DELETE"
})
.then(()=>loadData());

}

}

// ENTRADA DE STOCK
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

// SALIDA / VENTA
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

// PRODUCTO CON MÁS MOVIMIENTO
function getTopProduct(){

fetch("/productos/top-movimientos")
.then(res=>res.json())
.then(top=>{

alert(`📈 Producto con más movimiento:
${top.name}
Movimientos: ${top.movements}`);

});

}

// PRODUCTO MÁS VENDIDO
function getTopSellingProduct(){

fetch("/productos/top-ventas")
.then(res=>res.json())
.then(top=>{

alert(`🏆 Producto más vendido:
${top.name}
Cantidad vendida: ${top.sales}`);

});

}

// CALCULADORA DE PRECIOS
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

