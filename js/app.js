// ===================== FIRESTORE FIREBASE (NO MÁS LOCALSTORAGE) =====================
// db y funciones vienen del script type="module" en index.html
const db = window.firebaseDb;
const { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } = window.firebaseFns;

// Funciones Firestore para productos
async function leerProductos() {
    const snapshot = await getDocs(collection(db, "productos"));
    const productos = [];
    snapshot.forEach((d) => {
        productos.push({ id: d.id, ...d.data() });
    });
    return productos;
}

async function crearProducto(data) {
    const ref = await addDoc(collection(db, "productos"), data);
    return ref.id;
}

async function actualizarProducto(id, data) {
    const ref = doc(db, "productos", id);
    await updateDoc(ref, data);
}

async function eliminarProductoFirestore(id) {
    const ref = doc(db, "productos", id);
    await deleteDoc(ref);
}

// Funciones Firestore para ventas
async function leerVentas() {
    const snapshot = await getDocs(collection(db, "ventas"));
    const ventas = [];
    snapshot.forEach((d) => {
        ventas.push({ id: d.id, ...d.data() });
    });
    return ventas;
}

async function crearVenta(data) {
    await addDoc(collection(db, "ventas"), data);
}

// Generar ID sencillo (Firestore genera su propio ID, pero lo mantenemos para compatibilidad)
function generarId() {
    return Date.now();
}

// ===================== LOGIN SIMPLE =====================
const loginForm = document.getElementById("login-form");
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app-container");
const btnLogout = document.getElementById("btn-logout");

// Usuario fijo: admin / 1234
loginForm.addEventListener("submit", async (e) => {
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
        // Después de loguear, refrescamos vistas desde Firebase
        await renderProductos();
        await actualizarInventario();
        await poblarSelectProductosVenta();
        await renderVentas();
        await actualizarStats();
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
    btn.addEventListener("click", async () => {
        sections.forEach((sec) => sec.classList.remove("active"));
        document.getElementById(target).classList.add("active");

        // Actualizar datos al entrar a ciertas secciones
        if (target === "sec-productos") {
            await renderProductos();
        } else if (target === "sec-inventario") {
            await actualizarInventario();
        } else if (target === "sec-ventas") {
            await poblarSelectProductosVenta();
            await renderVentas();
        } else if (target === "sec-estadisticas") {
            await actualizarStats();
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
formProducto.addEventListener("submit", async (e) => {
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

    const idEdicion = inputProductoId.value;
    const dataProducto = { nombre, categoria, precio, cantidad, fechaRegistro: fecha };

    try {
        if (idEdicion) {
            // Modo edición
            await actualizarProducto(idEdicion, dataProducto);
            alert("Producto actualizado correctamente.");
        } else {
            // Nuevo producto
            await crearProducto(dataProducto);
            alert("Producto agregado correctamente.");
        }

        formProducto.reset();
        inputProductoId.value = "";
        btnCancelarEdicion.classList.add("hidden");
        await renderProductos();
        await actualizarInventario();
        await poblarSelectProductosVenta();
        await actualizarStats();
    } catch (err) {
        console.error("Error en Firebase:", err);
        alert("Error al guardar el producto en Firebase. Revisa la consola.");
    }
});

// Cancelar edición
btnCancelarEdicion.addEventListener("click", () => {
    formProducto.reset();
    inputProductoId.value = "";
    btnCancelarEdicion.classList.add("hidden");
});

// Renderizar tabla de productos
async function renderProductos() {
    try {
        const productos = await leerProductos();
        tablaProductosBody.innerHTML = "";

        productos.forEach((p) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${p.id}</td>
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.cantidad}</td>
                <td>${Number(p.precio).toFixed(2)}</td>
                <td>
                    <button class="btn-secondary btn-small" data-id="${p.id}" data-action="editar">Editar</button>
                    <button class="btn-secondary btn-small" data-id="${p.id}" data-action="eliminar">Eliminar</button>
                </td>
            `;

            tablaProductosBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error al cargar productos:", err);
        alert("Error al cargar productos desde Firebase.");
    }
}

// Delegación de eventos para editar/eliminar
tablaProductosBody.addEventListener("click", async (e) => {
    const btn = e.target;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;

    if (action === "editar") {
        await editarProducto(id);
    } else if (action === "eliminar") {
        eliminarProducto(id);
    }
});

async function editarProducto(id) {
    try {
        const productos = await leerProductos();
        const producto = productos.find((p) => p.id === id);
        if (!producto) return;

        inputProductoId.value = producto.id;
        document.getElementById("producto-nombre").value = producto.nombre;
        document.getElementById("producto-categoria").value = producto.categoria;
        document.getElementById("producto-precio").value = producto.precio;
        document.getElementById("producto-cantidad").value = producto.cantidad;
        document.getElementById("producto-fecha").value = producto.fechaRegistro || "";

        btnCancelarEdicion.classList.remove("hidden");
    } catch (err) {
        console.error("Error al editar producto:", err);
    }
}

async function eliminarProducto(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    try {
        await eliminarProductoFirestore(id);
        await renderProductos();
        await actualizarInventario();
        await poblarSelectProductosVenta();
        await actualizarStats();
    } catch (err) {
        console.error("Error al eliminar producto:", err);
        alert("Error al eliminar producto en Firebase.");
    }
}

// ===================== INVENTARIO =====================
const tablaInventarioBody = document.getElementById("tabla-inventario-body");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroBusqueda = document.getElementById("filtro-busqueda");
const btnAplicarFiltros = document.getElementById("btn-aplicar-filtros");
const btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
const btnActualizarInventario = document.getElementById("btn-actualizar-inventario");

async function actualizarInventario() {
    try {
        const productos = await leerProductos();
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
                    <td>${Number(p.precio).toFixed(2)}</td>
                    <td>${valorTotal.toFixed(2)}</td>
                `;
                tablaInventarioBody.appendChild(tr);
            });
    } catch (err) {
        console.error("Error al actualizar inventario:", err);
    }
}

// Botón "Actualizar inventario" (recarga desde Firebase)
btnActualizarInventario.addEventListener("click", async () => {
    await actualizarInventario();
    alert("Inventario actualizado desde Firebase Firestore.");
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
async function poblarSelectProductosVenta() {
    try {
        const productos = await leerProductos();
        selectVentaProducto.innerHTML = '<option value="">Selecciona un producto</option>';
        productos.forEach((p) => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = p.nombre;
            option.dataset.precio = p.precio;
            selectVentaProducto.appendChild(option);
        });
    } catch (err) {
        console.error("Error al poblar productos:", err);
    }
}

// Al cambiar de producto, actualizar precio unitario
selectVentaProducto.addEventListener("change", () => {
    const option = selectVentaProducto.options[selectVentaProducto.selectedIndex];
    const precio = option ? option.dataset.precio : 0;
    inputVentaPrecio.value = precio || "";
});

// Registrar venta
formVenta.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idProducto = selectVentaProducto.value;
    const cantidad = parseInt(inputVentaCantidad.value, 10);
    const precioUnitario = parseFloat(inputVentaPrecio.value);
    const fecha = inputVentaFecha.value || new Date().toISOString().slice(0, 10);

    if (!idProducto || isNaN(cantidad) || isNaN(precioUnitario) || cantidad <= 0) {
        alert("Por favor completa correctamente los datos de la venta.");
        return;
    }

    try {
        const productos = await leerProductos();
        const producto = productos.find((p) => p.id === idProducto);
        if (!producto) {
            alert("Producto no encontrado.");
            return;
        }

        if (producto.cantidad < cantidad) {
            alert("No hay suficiente inventario para esta venta.");
            return;
        }

        // Actualizar cantidad en producto
        await actualizarProducto(idProducto, {
            ...producto,
            cantidad: producto.cantidad - cantidad
        });

        const total = cantidad * precioUnitario;

        // Registrar venta
        await crearVenta({
            idProducto,
            nombreProducto: producto.nombre,
            cantidad,
            precioUnitario,
            total,
            fecha
        });

        alert("Venta registrada correctamente.");
        formVenta.reset();
        await poblarSelectProductosVenta();
        await renderVentas();
        await actualizarInventario();
        await actualizarStats();
    } catch (err) {
        console.error("Error al registrar venta:", err);
        alert("Error al registrar la venta en Firebase.");
    }
});

// Renderizar tabla de ventas
async function renderVentas() {
    try {
        const ventas = await leerVentas();
        tablaVentasBody.innerHTML = "";

        ventas
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .forEach((v) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${v.fecha}</td>
                    <td>${v.nombreProducto}</td>
                    <td>${v.cantidad}</td>
                    <td>${Number(v.precioUnitario).toFixed(2)}</td>
                    <td>${Number(v.total).toFixed(2)}</td>
                `;
                tablaVentasBody.appendChild(tr);
            });
    } catch (err) {
        console.error("Error al cargar ventas:", err);
    }
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
async function actualizarStats() {
    try {
        const productos = await leerProductos();
        const ventas = await leerVentas();

        // Total de productos registrados
        statTotalProductos.textContent = productos.length;

        // Valor total del inventario
        const valorTotal = productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0);
        statValorInventario.textContent = valorTotal.toFixed(2);

        // Aquí podrías filtrar ventas por rango de fechas para estadísticas más avanzadas
        // según statRango.value, inputStatDesde.value y inputStatHasta.value.
    } catch (err) {
        console.error("Error al calcular estadísticas:", err);
    }
}

btnActualizarStats.addEventListener("click", async () => {
    await actualizarStats();
    alert("Estadísticas actualizadas desde Firebase (rango simulado).");
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
