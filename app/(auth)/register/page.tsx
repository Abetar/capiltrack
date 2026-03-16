"use client"

import { useState } from "react"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Link from "next/link"

export default function RegisterPage(){

  const [name,setName] = useState("")
  const [clinic,setClinic] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  async function submit(e:any){
    e.preventDefault()

    setLoading(true)

    await fetch("/api/auth/register",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        name,
        email,
        password,
        clinicName:clinic
      })
    })

    window.location.href="/login"
  }

  return (
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:16}}>

      <h1 style={{fontSize:22,fontWeight:600}}>
        Crear cuenta
      </h1>

      <Input placeholder="Doctor name"
        onChange={(e:any)=>setName(e.target.value)}
      />

      <Input placeholder="Clinic name"
        onChange={(e:any)=>setClinic(e.target.value)}
      />

      <Input placeholder="Email"
        onChange={(e:any)=>setEmail(e.target.value)}
      />

      <Input type="password"
        placeholder="Password"
        onChange={(e:any)=>setPassword(e.target.value)}
      />

      <Button>
        Crear cuenta
      </Button>

      <Link href="/login">
        Ya tengo cuenta
      </Link>

    </form>
  )
}