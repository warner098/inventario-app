const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
host:"localhost",
user:"root",
password:"CamaraPuerto2026!",
database:"verduleria"
});

db.connect(err=>{
if(err){
console.log("Error DB",err);
return;
}
console.log("MySQL conectado");
});


// OBTENER PRODUCTOS
app.get("/productos",(req,res)=>{

db.query("SELECT * FROM productos",(err,result)=>{
if(err) throw err;

const productos = result.map(p=>({
id:p.id,
name:p.nombre,
quantity:p.cantidad,
unit:p.unidad,
registerDate:p.fecha_registro,
expiryDate:p.fecha_caducidad,
movements:p.movimientos,
sales:p.ventas
}));

res.json(productos);

});

});


// AGREGAR PRODUCTO
app.post("/productos",(req,res)=>{

const {name,quantity,unit,registerDate,expiryDate}=req.body;

db.query(
`INSERT INTO productos
(nombre,cantidad,unidad,fecha_registro,fecha_caducidad,movimientos,ventas)
VALUES (?,?,?,?,?,0,0)`,

[name,quantity,unit,registerDate,expiryDate],

(err,result)=>{
if(err) throw err;
res.json(result);
});

});


// EDITAR PRODUCTO
app.put("/productos/:id",(req,res)=>{

const id=req.params.id;

const {name,quantity,unit,registerDate,expiryDate}=req.body;

db.query(
`UPDATE productos
SET nombre=?,cantidad=?,unidad=?,fecha_registro=?,fecha_caducidad=?
WHERE id=?`,

[name,quantity,unit,registerDate,expiryDate,id],

(err,result)=>{
if(err) throw err;
res.json(result);
});

});


// ELIMINAR PRODUCTO
app.delete("/productos/:id",(req,res)=>{

const id=req.params.id;

db.query(
"DELETE FROM productos WHERE id=?",
[id],
(err,result)=>{
if(err) throw err;
res.json(result);
});

});


// ENTRADA STOCK
app.put("/productos/:id/entrada",(req,res)=>{

const id=req.params.id;
const {amount}=req.body;

db.query(
`UPDATE productos
SET cantidad = cantidad + ?,
movimientos = movimientos + 1
WHERE id=?`,

[amount,id],

(err,result)=>{
if(err) throw err;
res.json(result);
});

});


// SALIDA / VENTA
app.put("/productos/:id/salida",(req,res)=>{

const id=req.params.id;
const {amount}=req.body;

db.query(
`UPDATE productos
SET cantidad = cantidad - ?,
movimientos = movimientos + 1,
ventas = ventas + ?
WHERE id=?`,

[amount,amount,id],

(err,result)=>{
if(err) throw err;
res.json(result);
});

});


// PRODUCTO CON MAS MOVIMIENTO
app.get("/productos/top-movimientos",(req,res)=>{

db.query(
`SELECT * FROM productos
ORDER BY movimientos DESC
LIMIT 1`,

(err,result)=>{
if(err) throw err;

const p=result[0];

res.json({
name:p.nombre,
movements:p.movimientos
});

});

});


// PRODUCTO MAS VENDIDO
app.get("/productos/top-ventas",(req,res)=>{

db.query(
`SELECT * FROM productos
ORDER BY ventas DESC
LIMIT 1`,

(err,result)=>{
if(err) throw err;

const p=result[0];

res.json({
name:p.nombre,
sales:p.ventas
});

});

});


app.listen(3000,()=>{
console.log("Servidor corriendo en puerto 3000");
});