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
  const [error,setError] = useState("")

  async function submit(e:any){
    e.preventDefault()

    setError("")

    if(!name || !clinic || !email || !password){
      setError("Completa todos los campos")
      return
    }

    setLoading(true)

    try{

      // 🔥 SOLO STRIPE (QUITAMOS REGISTER + LOGIN)
      const checkoutRes = await fetch("/api/stripe/checkout",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          clinicName: clinic
        })
      })

      const data = await checkoutRes.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError("Error iniciando el pago")
        setLoading(false)
      }

    }catch(err){
      console.error(err)
      setError("Ocurrió un error al crear la cuenta")
      setLoading(false)
    }
  }

  return (
    <div
      className="md:grid md:grid-cols-2"
      style={{
        minHeight:"100vh",
        background:"#F8FAFC"
      }}
    >

      {/* LEFT SIDE */}
      <div style={{
        padding:40,
        display:"flex",
        flexDirection:"column",
        justifyContent:"center",
        gap:24,
        borderRight:"1px solid #E5E7EB"
      }}>

        <div>
          <h1 style={{fontSize:32,fontWeight:600,marginBottom:12}}>
            CapilTrack
          </h1>

          <p style={{color:"#6B7280"}}>
            Software diseñado para clínicas capilares que necesitan organizar pacientes,
            documentar evolución y controlar procedimientos sin perder información.
          </p>
        </div>

        <div>
          <p style={{fontWeight:600,marginBottom:8}}>
            Incluye:
          </p>

          <ul style={{
            color:"#6B7280",
            fontSize:14,
            lineHeight:"24px"
          }}>
            <li>• Pacientes ilimitados</li>
            <li>• Fotografías clínicas por zona</li>
            <li>• Seguimiento de evolución</li>
            <li>• Procedimientos de injerto</li>
            <li>• Historial clínico completo</li>
          </ul>
        </div>

        <div style={{
          padding:20,
          border:"1px solid #E5E7EB",
          borderRadius:10,
          maxWidth:300
        }}>
          <p style={{fontSize:14,color:"#6B7280"}}>
            Precio
          </p>

          <p style={{
            fontSize:36,
            fontWeight:600,
            color:"#2C6BED"
          }}>
            $1,499
          </p>

          <p style={{fontSize:12,color:"#9CA3AF"}}>
            MXN / mes por clínica
          </p>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div style={{
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        padding:20
      }}>

        <div style={{
          width:"100%",
          maxWidth:400,
          background:"white",
          border:"1px solid #E5E7EB",
          borderRadius:12,
          padding:28,
          display:"flex",
          flexDirection:"column",
          gap:16
        }}>

          <h2 style={{fontSize:22,fontWeight:600}}>
            Crear cuenta
          </h2>

          {/* ALERT */}
          {error && (
            <div style={{
              background:"#FEF2F2",
              border:"1px solid #FCA5A5",
              color:"#B91C1C",
              padding:"10px 12px",
              borderRadius:8,
              fontSize:14
            }}>
              {error}
            </div>
          )}

          <form
            onSubmit={submit}
            style={{display:"flex",flexDirection:"column",gap:12}}
          >

            <Input
              placeholder="Nombre del doctor"
              value={name}
              onChange={(e:any)=>setName(e.target.value)}
            />

            <Input
              placeholder="Nombre de la clínica"
              value={clinic}
              onChange={(e:any)=>setClinic(e.target.value)}
            />

            <Input
              placeholder="Email"
              value={email}
              onChange={(e:any)=>setEmail(e.target.value)}
            />

            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e:any)=>setPassword(e.target.value)}
            />

            <Button>
              {loading ? "Redirigiendo a pago..." : "Crear cuenta"}
            </Button>

          </form>

          <p style={{fontSize:12,color:"#9CA3AF"}}>
            Tu cuenta se activará después de completar el pago.
          </p>

          <Link href="/login" style={{fontSize:14}}>
            Ya tengo cuenta
          </Link>

        </div>

      </div>

    </div>
  )
}