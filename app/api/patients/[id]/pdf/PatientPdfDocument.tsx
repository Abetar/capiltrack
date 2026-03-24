import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type HairMetric = {
  id: string;
  zone: string | null;
  density: number | null;
  thickness: number | null;
};

type Consultation = {
  id: string;
  date: Date;
  norwoodLevel: number | null;
  notes: string | null;
  metrics: HairMetric[];
};

type TransplantProcedure = {
  id: string;
  date: Date;
  technique: string | null;
  method: string | null;
  grafts: number | null;
  donorArea: string | null;
  recipientArea: string | null;
  anesthesiaType: string | null;
  anesthesiaMl: number | null;
  notes: string | null;
  observations: string | null;
  medicalTeam: string | null;
  nurses: string | null;
};

type Clinic = {
  name: string;
  logoUrl: string | null;
};

type Patient = {
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  gender: string | null;
  notes: string | null;
  consultations: Consultation[];
  transplants: TransplantProcedure[];
};

type Props = {
  clinic: Clinic;
  patient: Patient;
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    color: "#111827",
  },

  header: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  clinicName: {
    fontSize: 16,
    fontWeight: 700,
  },

  logo: {
    width: 90,
    height: 45,
    objectFit: "contain",
  },

  section: {
    marginBottom: 18,
  },

  title: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },

  row: {
    marginBottom: 4,
  },

  bold: {
    fontWeight: 700,
  },

  table: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  tableRow: {
    flexDirection: "row",
  },

  cellHeader: {
    flex: 1,
    fontWeight: 700,
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },

  cell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },

  block: {
    marginBottom: 12,
  },

  muted: {
    color: "#6B7280",
  },
});

export default function PatientPdfDocument({ clinic, patient }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.clinicName}>{clinic.name}</Text>

          {clinic.logoUrl && (
            <Image src={clinic.logoUrl} style={styles.logo} />
          )}
        </View>

        {/* PACIENTE */}
        <View style={styles.section}>
          <Text style={styles.title}>Ficha del paciente</Text>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.cellHeader}>Nombre</Text>
              <Text style={styles.cell}>
                {patient.firstName} {patient.lastName ?? ""}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.cellHeader}>Email</Text>
              <Text style={styles.cell}>{patient.email ?? "-"}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.cellHeader}>Teléfono</Text>
              <Text style={styles.cell}>{patient.phone ?? "-"}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.cellHeader}>Nacimiento</Text>
              <Text style={styles.cell}>
                {patient.birthDate
                  ? new Date(patient.birthDate).toLocaleDateString()
                  : "-"}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.cellHeader}>Género</Text>
              <Text style={styles.cell}>{patient.gender ?? "-"}</Text>
            </View>
          </View>
        </View>

        {/* CONSULTAS */}
        <View style={styles.section}>
          <Text style={styles.title}>Consultas</Text>

          {patient.consultations.length === 0 ? (
            <Text style={styles.muted}>Sin consultas</Text>
          ) : (
            patient.consultations.map((c) => (
              <View key={c.id} style={styles.block}>
                <Text style={styles.bold}>
                  {new Date(c.date).toLocaleDateString()} — Norwood{" "}
                  {c.norwoodLevel ?? "-"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Notas: </Text>
                  {c.notes ?? "-"}
                </Text>

                {/* TABLA MÉTRICAS */}
                {c.metrics.length > 0 && (
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <Text style={styles.cellHeader}>Zona</Text>
                      <Text style={styles.cellHeader}>Densidad</Text>
                      <Text style={styles.cellHeader}>Grosor</Text>
                    </View>

                    {c.metrics.map((m) => (
                      <View key={m.id} style={styles.tableRow}>
                        <Text style={styles.cell}>{m.zone ?? "-"}</Text>
                        <Text style={styles.cell}>
                          {m.density ?? "-"}
                        </Text>
                        <Text style={styles.cell}>
                          {m.thickness ?? "-"}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* PROCEDIMIENTOS */}
        <View style={styles.section}>
          <Text style={styles.title}>Procedimientos</Text>

          {patient.transplants.length === 0 ? (
            <Text style={styles.muted}>Sin procedimientos</Text>
          ) : (
            patient.transplants.map((p) => (
              <View key={p.id} style={styles.block}>
                <Text style={styles.bold}>
                  {new Date(p.date).toLocaleDateString()} —{" "}
                  {p.technique ?? "-"}
                </Text>

                <View style={styles.table}>
                  <View style={styles.tableRow}>
                    <Text style={styles.cellHeader}>Grafts</Text>
                    <Text style={styles.cellHeader}>Donante</Text>
                    <Text style={styles.cellHeader}>Receptora</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={styles.cell}>
                      {p.grafts ?? "-"}
                    </Text>
                    <Text style={styles.cell}>
                      {p.donorArea ?? "-"}
                    </Text>
                    <Text style={styles.cell}>
                      {p.recipientArea ?? "-"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Anestesia: </Text>
                  {p.anesthesiaType ?? "-"} ({p.anesthesiaMl ?? "-"} ml)
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Equipo: </Text>
                  {p.medicalTeam ?? "-"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Notas: </Text>
                  {p.notes ?? "-"}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}