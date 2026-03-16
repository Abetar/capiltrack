"use client"

import { useState } from "react"

export default function NewPatientPage() {

  const [firstName,setFirstName] = useState("")
  const [lastName,setLastName] = useState("")
  const [phone,setPhone] = useState("")
  const [email,setEmail] = useState("")
  const [error,setError] = useState("")

  function validate(){

    if(!firstName || firstName.trim().length < 2){
      return "El nombre es obligatorio"
    }

    if(phone && !/^[0-9]+$/.test(phone)){
      return "El teléfono solo puede contener números"
    }

    if(phone && phone.length < 8){
      return "El teléfono parece demasiado corto"
    }

    if(email && !/^\S+@\S+\.\S+$/.test(email)){
      return "El email no tiene un formato válido"
    }

    return null
  }

  async function submit(e:any){
    e.preventDefault()

    const validationError = validate()

    if(validationError){
      setError(validationError)
      return
    }

    const res = await fetch("/api/patients",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        firstName,
        lastName,
        phone,
        email
      })
    })

    if(!res.ok){
      setError("No se pudo crear el paciente")
      return
    }

    window.location.href="/patients"
  }

  return (
    <div style={{maxWidth:500}}>

      <h1
        style={{
          fontSize:26,
          fontWeight:600,
          marginBottom:20
        }}
      >
        Nuevo paciente
      </h1>

      <form
        onSubmit={submit}
        style={{
          display:"flex",
          flexDirection:"column",
          gap:16
        }}
      >

        <input
          className="ui-input"
          placeholder="Nombre *"
          value={firstName}
          onChange={(e)=>setFirstName(e.target.value)}
        />

        <input
          className="ui-input"
          placeholder="Apellido"
          value={lastName}
          onChange={(e)=>setLastName(e.target.value)}
        />

        <input
          className="ui-input"
          placeholder="Teléfono"
          value={phone}
          onChange={(e)=>{
            const value = e.target.value.replace(/[^0-9]/g,"")
            setPhone(value)
          }}
        />

        <input
          className="ui-input"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        {error && (
          <p style={{color:"#DC2626",fontSize:13}}>
            {error}
          </p>
        )}

        <button className="ui-button">
          Crear paciente
        </button>

      </form>

    </div>
  )
}
