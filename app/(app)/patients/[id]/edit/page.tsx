"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

export default function EditPatientPage() {

  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)

  const [firstName,setFirstName] = useState("")
  const [lastName,setLastName] = useState("")
  const [phone,setPhone] = useState("")
  const [email,setEmail] = useState("")
  const [birthDate,setBirthDate] = useState("")
  const [gender,setGender] = useState("")
  const [notes,setNotes] = useState("")

  const [error,setError] = useState("")

  useEffect(() => {
    loadPatient()
  }, [id])

  async function loadPatient() {

    const res = await fetch(`/api/patients/${id}`)

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Error cargando paciente")
      setLoading(false)
      return
    }

    setFirstName(data.firstName || "")
    setLastName(data.lastName || "")
    setPhone(data.phone || "")
    setEmail(data.email || "")
    setBirthDate(data.birthDate ? data.birthDate.substring(0,10) : "")
    setGender(data.gender || "")
    setNotes(data.notes || "")

    setLoading(false)
  }

  async function submit(e: React.FormEvent){
    e.preventDefault()

    const res = await fetch(`/api/patients/${id}`,{
      method:"PATCH",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        firstName,
        lastName,
        phone,
        email,
        birthDate,
        gender,
        notes
      })
    })

    const data = await res.json()

    if(!res.ok){
      setError(data.error || "Error actualizando paciente")
      return
    }

    router.push(`/patients/${id}`)
  }

  if(loading){
    return <div>Cargando paciente...</div>
  }

  return (
    <div style={{maxWidth:600}}>

      <h1
        style={{
          fontSize:26,
          fontWeight:600,
          marginBottom:20
        }}
      >
        Editar paciente
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
          placeholder="Nombre"
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
          onChange={(e)=>setPhone(e.target.value)}
        />

        <input
          className="ui-input"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="date"
          className="ui-input"
          value={birthDate}
          onChange={(e)=>setBirthDate(e.target.value)}
        />

        <select
          className="ui-input"
          value={gender}
          onChange={(e)=>setGender(e.target.value)}
        >
          <option value="">Género</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="other">Otro</option>
        </select>

        <textarea
          className="ui-input"
          placeholder="Notas clínicas"
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
        />

        {error && (
          <p style={{color:"red"}}>{error}</p>
        )}

        <button className="ui-button">
          Guardar cambios
        </button>

      </form>

    </div>
  )
}
