// ===================== DATOS EN LOCALSTORAGE (SIMULANDO BD) =====================
// Claves de localStorage
const LS_PRODUCTOS = "papeleria_productos";
const LS_VENTAS = "papeleria_ventas";

// Funciones helper para leer/escribir localStorage
function leerProductos() {
    const data = localStorage.getItem(LS_PRODUCTOS);
    return data ? JSON.parse(data) : [];
}

function guardarProductos(lista) {
    localStorage.setItem(LS_PRODUCTOS, JSON.stringify(lista));
}

function leerVentas() {
    const data = localStorage.getItem(LS_VENTAS);
    return data ? JSON.parse(data) : [];
}

function guardarVentas(lista) {
    localStorage.setItem(LS_VENTAS, JSON.stringify(lista));
}

// Generar ID sencillo (autoincremental basado en timestamp)
function generarId() {
    return Date.now();
}

// ===================== LOGIN SIMPLE =====================
const loginForm = document.getElementById("login-form");
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app-container");
const btnLogout = document.getElementById("btn-logout");

// Usuario fijo: admin / 1234
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("login-usuario").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!usuario || !password) {
        alert("Por favor ingresa usuario y contraseña.");
        return;
    }

    if (usuario === "admin" && password === "1234") {
        loginContainer.classList.add("hidden");
        appContainer.classList.remove("hidden");
        // Después de loguear, refrescamos vistas
        renderProductos();
        actualizarInventario();
        poblarSelectProductosVenta();
        renderVentas();
        actualizarStats();
        poblarMasVendidosEjemplo();
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
});

btnLogout.addEventListener("click", () => {
    appContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
    loginForm.reset();
});

// ===================== NAVEGACIÓN ENTRE SECCIONES =====================
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");

navButtons.forEach((btn) => {
    const target = btn.dataset.section;
    if (!target) return;
    btn.addEventListener("click", () => {
        sections.forEach((sec) => sec.classList.remove("active"));
        document.getElementById(target).classList.add("active");

        // Actualizar datos al entrar a ciertas secciones
        if (target === "sec-productos") {
            renderProductos();
        } else if (target === "sec-inventario") {
            actualizarInventario();
        } else if (target === "sec-ventas") {
            poblarSelectProductosVenta();
            renderVentas();
        } else if (target === "sec-estadisticas") {
            actualizarStats();
            poblarMasVendidosEjemplo();
        }
    });
});

// ===================== CRUD PRODUCTOS =====================
const formProducto = document.getElementById("form-producto");
const tablaProductosBody = document.getElementById("tabla-productos-body");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
const inputProductoId = document.getElementById("producto-id");

// Guardar o editar producto
formProducto.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("producto-nombre").value.trim();
    const categoria = document.getElementById("producto-categoria").value.trim();
    const precio = parseFloat(document.getElementById("producto-precio").value);
    const cantidad = parseInt(document.getElementById("producto-cantidad").value, 10);
    const fecha = document.getElementById("producto-fecha").value || new Date().toISOString().slice(0, 10);

    if (!nombre || !categoria || isNaN(precio) || isNaN(cantidad)) {
        alert("Por favor completa todos los campos del producto.");
        return;
    }

    let productos = leerProductos();
    const idEdicion = inputProductoId.value;

    if (idEdicion) {
        // Modo edición
        productos = productos.map((p) =>
            p.id === Number(idEdicion)
                ? { ...p, nombre, categoria, precio, cantidad, fechaRegistro: fecha }
                : p
        );
        alert("Producto actualizado correctamente.");
    } else {
        // Nuevo producto
        const nuevo = {
            id: generarId(),
            nombre,
            categoria,
            precio,
            cantidad,
            fechaRegistro: fecha,
        };
        productos.push(nuevo);
        alert("Producto agregado correctamente.");
    }

    guardarProductos(productos);
    formProducto.reset();
    inputProductoId.value = "";
    btnCancelarEdicion.classList.add("hidden");
    renderProductos();
    actualizarInventario();
    poblarSelectProductosVenta();
    actualizarStats();

    // Aquí podrías hacer un POST/PUT a una API REST en lugar de localStorage.
    // Ejemplo:
    // fetch('/api/productos', { method: 'POST', body: JSON.stringify(nuevo), headers: { 'Content-Type': 'application/json' } })
});

// Cancelar edición
btnCancelarEdicion.addEventListener("click", () => {
    formProducto.reset();
    inputProductoId.value = "";
    btnCancelarEdicion.classList.add("hidden");
});

// Renderizar tabla de productos
function renderProductos() {
    const productos = leerProductos();
    tablaProductosBody.innerHTML = "";

    productos.forEach((p) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>${p.cantidad}</td>
            <td>${p.precio.toFixed(2)}</td>
            <td>
                <button class="btn-secondary btn-small" data-id="${p.id}" data-action="editar">Editar</button>
                <button class="btn-secondary btn-small" data-id="${p.id}" data-action="eliminar">Eliminar</button>
            </td>
        `;

        tablaProductosBody.appendChild(tr);
    });
}

// Delegación de eventos para editar/eliminar
tablaProductosBody.addEventListener("click", (e) => {
    const btn = e.target;
    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    if (!action || !id) return;

    if (action === "editar") {
        editarProducto(id);
    } else if (action === "eliminar") {
        eliminarProducto(id);
    }
});

function editarProducto(id) {
    const productos = leerProductos();
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    inputProductoId.value = producto.id;
    document.getElementById("producto-nombre").value = producto.nombre;
    document.getElementById("producto-categoria").value = producto.categoria;
    document.getElementById("producto-precio").value = producto.precio;
    document.getElementById("producto-cantidad").value = producto.cantidad;
    document.getElementById("producto-fecha").value = producto.fechaRegistro || "";

    btnCancelarEdicion.classList.remove("hidden");
}

function eliminarProducto(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    let productos = leerProductos();
    productos = productos.filter((p) => p.id !== id);
    guardarProductos(productos);
    renderProductos();
    actualizarInventario();
    poblarSelectProductosVenta();
    actualizarStats();

    // Aquí podrías llamar a DELETE /api/productos/:id en tu backend.
}

// ===================== INVENTARIO =====================
const tablaInventarioBody = document.getElementById("tabla-inventario-body");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroBusqueda = document.getElementById("filtro-busqueda");
const btnAplicarFiltros = document.getElementById("btn-aplicar-filtros");
const btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
const btnActualizarInventario = document.getElementById("btn-actualizar-inventario");

function actualizarInventario() {
    const productos = leerProductos();
    const catFiltro = filtroCategoria.value.trim().toLowerCase();
    const textoFiltro = filtroBusqueda.value.trim().toLowerCase();

    tablaInventarioBody.innerHTML = "";

    productos
        .filter((p) => {
            const coincideCategoria = catFiltro ? p.categoria.toLowerCase().includes(catFiltro) : true;
            const coincideTexto = textoFiltro ? p.nombre.toLowerCase().includes(textoFiltro) : true;
            return coincideCategoria && coincideTexto;
        })
        .forEach((p) => {
            const valorTotal = p.cantidad * p.precio;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.cantidad}</td>
                <td>${p.precio.toFixed(2)}</td>
                <td>${valorTotal.toFixed(2)}</td>
            `;
            tablaInventarioBody.appendChild(tr);
        });
}

// Botón "Actualizar inventario" (simula recarga desde BD)
btnActualizarInventario.addEventListener("click", () => {
    actualizarInventario();
    alert("Inventario actualizado desde la base de datos (simulado).");
});

btnAplicarFiltros.addEventListener("click", () => {
    actualizarInventario();
});

btnLimpiarFiltros.addEventListener("click", () => {
    filtroCategoria.value = "";
    filtroBusqueda.value = "";
    actualizarInventario();
});

// ===================== VENTAS =====================
const formVenta = document.getElementById("form-venta");
const selectVentaProducto = document.getElementById("venta-producto");
const inputVentaCantidad = document.getElementById("venta-cantidad");
const inputVentaPrecio = document.getElementById("venta-precio");
const inputVentaFecha = document.getElementById("venta-fecha");
const tablaVentasBody = document.getElementById("tabla-ventas-body");

// Llenar select de productos
function poblarSelectProductosVenta() {
    const productos = leerProductos();
    selectVentaProducto.innerHTML = '<option value="">Selecciona un producto</option>';
    productos.forEach((p) => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nombre;
        option.dataset.precio = p.precio;
        selectVentaProducto.appendChild(option);
    });
}

// Al cambiar de producto, actualizar precio unitario
selectVentaProducto.addEventListener("change", () => {
    const option = selectVentaProducto.options[selectVentaProducto.selectedIndex];
    const precio = option ? option.dataset.precio : 0;
    inputVentaPrecio.value = precio || "";
});

// Registrar venta
formVenta.addEventListener("submit", (e) => {
    e.preventDefault();

    const idProducto = Number(selectVentaProducto.value);
    const cantidad = parseInt(inputVentaCantidad.value, 10);
    const precioUnitario = parseFloat(inputVentaPrecio.value);
    const fecha = inputVentaFecha.value || new Date().toISOString().slice(0, 10);

    if (!idProducto || isNaN(cantidad) || isNaN(precioUnitario) || cantidad <= 0) {
        alert("Por favor completa correctamente los datos de la venta.");
        return;
    }

    let productos = leerProductos();
    const producto = productos.find((p) => p.id === idProducto);
    if (!producto) {
        alert("Producto no encontrado.");
        return;
    }

    if (producto.cantidad < cantidad) {
        alert("No hay suficiente inventario para esta venta.");
        return;
    }

    // Actualizar inventario
    producto.cantidad -= cantidad;
    productos = productos.map((p) => (p.id === producto.id ? producto : p));
    guardarProductos(productos);

    // Registrar venta
    const total = cantidad * precioUnitario;
    let ventas = leerVentas();
    const nuevaVenta = {
        id: generarId(),
        idProducto,
        nombreProducto: producto.nombre,
        cantidad,
        precioUnitario,
        total,
        fecha,
    };
    ventas.push(nuevaVenta);
    guardarVentas(ventas);

    alert("Venta registrada correctamente.");
    formVenta.reset();
    poblarSelectProductosVenta();
    renderVentas();
    actualizarInventario();
    actualizarStats();

    // Aquí se integraría con la tabla 'ventas' real en una base de datos.
    // Ejemplo:
    // fetch('/api/ventas', { method: 'POST', body: JSON.stringify(nuevaVenta), headers: { 'Content-Type': 'application/json' } })
});

// Renderizar tabla de ventas
function renderVentas() {
    const ventas = leerVentas();
    tablaVentasBody.innerHTML = "";

    ventas
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .forEach((v) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${v.fecha}</td>
                <td>${v.nombreProducto}</td>
                <td>${v.cantidad}</td>
                <td>${v.precioUnitario.toFixed(2)}</td>
                <td>${v.total.toFixed(2)}</td>
            `;
            tablaVentasBody.appendChild(tr);
        });
}

// ===================== ESTADÍSTICAS =====================
const statTotalProductos = document.getElementById("stat-total-productos");
const statValorInventario = document.getElementById("stat-valor-inventario");
const statRango = document.getElementById("stat-rango");
const rangoPersonalizadoFechas = document.getElementById("rango-personalizado-fechas");
const inputStatDesde = document.getElementById("stat-desde");
const inputStatHasta = document.getElementById("stat-hasta");
const btnActualizarStats = document.getElementById("btn-actualizar-stats");
const tablaMasVendidos = document.getElementById("tabla-mas-vendidos");

// Mostrar/ocultar fechas según rango
statRango.addEventListener("change", () => {
    if (statRango.value === "personalizado") {
        rangoPersonalizadoFechas.classList.remove("hidden");
    } else {
        rangoPersonalizadoFechas.classList.add("hidden");
    }
});

// Calcular estadísticas básicas
function actualizarStats() {
    const productos = leerProductos();
    const ventas = leerVentas();

    // Total de productos registrados
    statTotalProductos.textContent = productos.length;

    // Valor total del inventario
    const valorTotal = productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0);
    statValorInventario.textContent = valorTotal.toFixed(2);

    // Aquí podrías filtrar ventas por rango de fechas para estadísticas más avanzadas
    // según statRango.value, inputStatDesde.value y inputStatHasta.value.
}

btnActualizarStats.addEventListener("click", () => {
    // Por ahora solo recalcula usando todos los datos.
    // Cuando tengas la lógica de ventas por rango, aplícala aquí.
    actualizarStats();
    alert("Estadísticas actualizadas (rango simulado).");
});

// Datos de ejemplo para "productos más vendidos"
function poblarMasVendidosEjemplo() {
    tablaMasVendidos.innerHTML = "";

    const datosEjemplo = [
        { producto: "Cuaderno cuadriculado", unidades: 120 },
        { producto: "Lápiz HB", unidades: 95 },
        { producto: "Borrador blanco", unidades: 70 },
    ];

    datosEjemplo.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.producto}</td>
            <td>${item.unidades}</td>
        `;
        tablaMasVendidos.appendChild(tr);
    });

    // Cuando tengas ventas reales, aquí agruparías las ventas por producto,
    // sumarías cantidades y ordenarías de mayor a menor.
}
