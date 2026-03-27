import { createContext, useContext, useState, useEffect } from "react"

const StoreContext = createContext(null)

/* ================= STORE PROVIDER ================= */
export const StoreProvider = ({ children }) => {

  /* ================= PRODUCTS ================= */
  const [products, setProducts] = useState([])

  /* ================= CART ================= */
  const [cart, setCart] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem("cart")) || []
      console.log("🛒 CART LOADED:", data)
      return data
    } catch {
      return []
    }
  })

  /* ================= USERS / NETWORK ================= */
  const [users, setUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("users")) || []
    } catch {
      return []
    }
  })

  /* ================= NETWORK TREE ================= */
  const [networkTree, setNetworkTree] = useState([])

  /* =====================================================
     🔥 FETCH PRODUCTS FROM BACKEND (FINAL FIX)
  ===================================================== */
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token")
      const storedUser = JSON.parse(localStorage.getItem("user"))

      let url = "http://localhost:5000/products/public"

      if (token && storedUser) {
        console.log("🔥 Fetching products as:", storedUser.role)
        url = "http://localhost:5000/products/all"
      } else {
        console.log("👀 Guest user → loading public products")
      }

      const res = await fetch(url, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {}
      })

      if (!res.ok) {
        console.warn("⚠️ Products fetch failed:", res.status)
        return
      }

      const data = await res.json()

      if (!Array.isArray(data)) {
        console.warn("⚠️ Invalid product format")
        return
      }

      console.log("✅ Products loaded:", data.length)

      setProducts(data)
      localStorage.setItem("products", JSON.stringify(data))

    } catch (err) {
      console.error("❌ Fetch products error:", err)
    }
  }

  /* =====================================================
     🔥 FETCH USERS
  ===================================================== */
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const storedUser = JSON.parse(localStorage.getItem("user"))

      if (!token || !storedUser) return
      if (storedUser.role !== "admin") return

      const res = await fetch("http://localhost:5000/users/tree", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) return

      const data = await res.json()
      if (!Array.isArray(data)) return

      setNetworkTree(data)

      const flatten = (nodes, acc = []) => {
        nodes.forEach(n => {
          acc.push({
            id: n.id,
            name: n.name,
            role: n.role,
            parentId: n.parentId || null
          })
          if (n.children?.length) flatten(n.children, acc)
        })
        return acc
      }

      const flatUsers = flatten(data)
      setUsers(flatUsers)
      localStorage.setItem("users", JSON.stringify(flatUsers))

    } catch (err) {
      console.error("❌ Fetch users error:", err)
    }
  }

  /* ================= AUTO SYNC ================= */
  useEffect(() => {
    setTimeout(() => {
      fetchUsers()
      fetchProducts()
    }, 300)

    window.addEventListener("storage", fetchProducts)
    return () => window.removeEventListener("storage", fetchProducts)

  }, [])

  /* ================= CART SAVE ================= */
  useEffect(() => {
    console.log("🛒 CART UPDATED:", cart)
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  /* ================= PRODUCT ACTIONS ================= */
  const addProduct = (product) => {
    setProducts(prev => [...prev, product])
  }

  const deleteProduct = (id) => {
    setProducts(prev =>
      prev.filter(p => (p._id || p.id) !== id)
    )
  }

  /* ================= CART ACTIONS ================= */
  const addToCart = (product) => {
    const productId = product._id || product.id

    setCart(prev => {
      const existing = prev.find(p =>
        (p._id || p.id) === productId
      )

      if (existing) {
        return prev.map(p =>
          (p._id || p.id) === productId
            ? { ...p, qty: p.qty + 1 }
            : p
        )
      }

      /* ⭐ IMPORTANT ADD – backend friendly item */
      const safeProduct = {
        ...product,
        id: productId,
        productId: productId,
        productName: product.title || product.name,
        price: product.price,
        qty: 1
      }

      console.log("➕ ADD TO CART:", safeProduct)

      return [...prev, safeProduct]
    })
  }

  const incQty = (id) => {
    setCart(prev =>
      prev.map(item =>
        (item._id || item.id) === id
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    )
  }

  const decQty = (id) => {
    setCart(prev =>
      prev
        .map(item =>
          (item._id || item.id) === id
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter(item => item.qty > 0)
    )
  }

  const removeFromCart = (id) => {
    setCart(prev =>
      prev.filter(item =>
        (item._id || item.id) !== id
      )
    )
  }

  const clearCart = () => setCart([])

  /* ================= CONTEXT VALUE ================= */
  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        users,
        networkTree,
        setProducts,
        setCart,
        setUsers,
        addProduct,
        deleteProduct,
        addToCart,
        incQty,
        decQty,
        removeFromCart,
        clearCart,
        addUser: (u) => setUsers(prev => [...prev, u]),
        fetchUsers,
        fetchProducts
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

/* ================= CUSTOM HOOK ================= */
export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider")
  }
  return context
}