import { useState } from "react"

export default function PasswordHelp() {

  const [email,setEmail] = useState("")
  const [whatsapp,setWhatsapp] = useState("")
  const [msg,setMsg] = useState("")

  const submitRequest = async () => {

    const res = await fetch(
      "http://localhost:5000/password-help",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          email,
          whatsapp
        })
      }
    )

    const data = await res.json()

    if(res.ok){
      setMsg("Request sent to admin")
    }
    else{
      setMsg(data.message)
    }
  }

  return(
    <div className="max-w-md mx-auto bg-white p-6 shadow rounded mt-10">

      <h2 className="text-xl font-bold mb-4">
        Password Reset Request
      </h2>

      <input
        placeholder="Your Email"
        value={email}
        onChange={e=>setEmail(e.target.value)}
        className="border w-full p-2 mb-3"
      />

      <input
        placeholder="WhatsApp Number"
        value={whatsapp}
        onChange={e=>setWhatsapp(e.target.value)}
        className="border w-full p-2 mb-3"
      />

      <button
        onClick={submitRequest}
        className="bg-green-600 text-white px-4 py-2 rounded w-full"
      >
        Submit Request
      </button>

      {msg && (
        <div className="mt-3 text-blue-600">
          {msg}
        </div>
      )}

    </div>
  )
}