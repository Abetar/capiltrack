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
  extractedFollicularUnits: number | null;
  implantedFollicularUnits: number | null;
  extractedFollicles: number | null;
  implantedFollicles: number | null;
  donorArea: string | null;
  recipientArea: string | null;
  anesthesiaType: string | null;
  anesthesiaMl: number | null;
  extractionStart: Date | null;
  extractionEnd: Date | null;
  implantationStart: Date | null;
  implantationEnd: Date | null;
  notes: string | null;
  observations: string | null;
  medicalTeam: string | null;
  nurses: string | null;
};

type PatientClinicalAnswer = {
  id: string;
  questionTextSnapshot: string;
  answerText: string | null;
};

type PrescriptionItem = {
  id: string;
  medication: string;
  presentation: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  indications: string | null;
  order: number;
};

type Prescription = {
  id: string;
  date: Date;
  diagnosis: string | null;
  generalNotes: string | null;
  consultation: {
    id: string;
    date: Date;
  };
  items: PrescriptionItem[];
};

type Clinic = {
  name: string;
  logoUrl: string | null;
  doctorName: string | null;
  doctorLicense: string | null;
  doctorPhone: string | null;
};

type Patient = {
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  gender: string | null;
  notes: string | null;
  clinicalAnswers: PatientClinicalAnswer[];
  consultations: Consultation[];
  transplants: TransplantProcedure[];
  prescriptions: Prescription[];
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
  questionHeader: {
    flex: 1.2,
    fontWeight: 700,
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  answerHeader: {
    flex: 1.8,
    fontWeight: 700,
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  questionCell: {
    flex: 1.2,
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },
  answerCell: {
    flex: 1.8,
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
        <View style={styles.header}>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          {clinic.logoUrl && <Image src={clinic.logoUrl} style={styles.logo} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Ficha del paciente</Text>

          <View style={styles.table}>
            <Row
              label="Nombre"
              value={`${patient.firstName} ${patient.lastName ?? ""}`}
            />
            <Row label="Email" value={patient.email ?? "-"} />
            <Row label="Teléfono" value={patient.phone ?? "-"} />
            <Row
              label="Nacimiento"
              value={
                patient.birthDate
                  ? new Date(patient.birthDate).toLocaleDateString()
                  : "-"
              }
            />
            <Row label="Género" value={patient.gender ?? "-"} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Expediente clínico inicial</Text>

          {patient.clinicalAnswers.length === 0 ? (
            <Text style={styles.muted}>Sin expediente clínico registrado</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.questionHeader}>Pregunta</Text>
                <Text style={styles.answerHeader}>Respuesta</Text>
              </View>

              {patient.clinicalAnswers.map((answer) => (
                <View key={answer.id} style={styles.tableRow}>
                  <Text style={styles.questionCell}>
                    {answer.questionTextSnapshot}
                  </Text>
                  <Text style={styles.answerCell}>
                    {answer.answerText || "-"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Recetas médicas</Text>

          {patient.prescriptions.length === 0 ? (
            <Text style={styles.muted}>Sin recetas médicas registradas</Text>
          ) : (
            patient.prescriptions.map((prescription) => (
              <View key={prescription.id} style={styles.block}>
                <Text style={styles.bold}>
                  {new Date(prescription.date).toLocaleDateString()} — Consulta{" "}
                  {new Date(
                    prescription.consultation.date
                  ).toLocaleDateString()}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Médico: </Text>
                  {clinic.doctorName || "No configurado"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Cédula: </Text>
                  {clinic.doctorLicense || "No configurada"}
                </Text>

                {clinic.doctorPhone && (
                  <Text style={styles.row}>
                    <Text style={styles.bold}>Teléfono: </Text>
                    {clinic.doctorPhone}
                  </Text>
                )}

                {prescription.diagnosis && (
                  <Text style={styles.row}>
                    <Text style={styles.bold}>Diagnóstico: </Text>
                    {prescription.diagnosis}
                  </Text>
                )}

                {prescription.items.map((item, index) => (
                  <View key={item.id} style={styles.table}>
                    <View style={styles.tableRow}>
                      <Text style={styles.cellHeader}>
                        Medicamento {index + 1}
                      </Text>
                      <Text style={styles.cell}>{item.medication}</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={styles.cellHeader}>Presentación</Text>
                      <Text style={styles.cell}>{item.presentation ?? "-"}</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={styles.cellHeader}>Dosis</Text>
                      <Text style={styles.cell}>{item.dosage ?? "-"}</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={styles.cellHeader}>Frecuencia</Text>
                      <Text style={styles.cell}>{item.frequency ?? "-"}</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={styles.cellHeader}>Duración</Text>
                      <Text style={styles.cell}>{item.duration ?? "-"}</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={styles.cellHeader}>Indicaciones</Text>
                      <Text style={styles.cell}>{item.indications ?? "-"}</Text>
                    </View>
                  </View>
                ))}

                {prescription.generalNotes && (
                  <Text style={styles.row}>
                    <Text style={styles.bold}>Notas generales: </Text>
                    {prescription.generalNotes}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

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
                        <Text style={styles.cell}>{m.density ?? "-"}</Text>
                        <Text style={styles.cell}>{m.thickness ?? "-"}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

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
                    <Text style={styles.cellHeader}>UF extraídas</Text>
                    <Text style={styles.cellHeader}>UF implantadas</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={styles.cell}>{p.grafts ?? "-"}</Text>
                    <Text style={styles.cell}>
                      {p.extractedFollicularUnits ?? "-"}
                    </Text>
                    <Text style={styles.cell}>
                      {p.implantedFollicularUnits ?? "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.table}>
                  <View style={styles.tableRow}>
                    <Text style={styles.cellHeader}>Folículos extraídos</Text>
                    <Text style={styles.cellHeader}>Folículos implantados</Text>
                    <Text style={styles.cellHeader}>Método</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={styles.cell}>
                      {p.extractedFollicles ?? "-"}
                    </Text>
                    <Text style={styles.cell}>
                      {p.implantedFollicles ?? "-"}
                    </Text>
                    <Text style={styles.cell}>{p.method ?? "-"}</Text>
                  </View>
                </View>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Zona donante: </Text>
                  {p.donorArea ?? "-"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Zona receptora: </Text>
                  {p.recipientArea ?? "-"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Anestesia: </Text>
                  {p.anesthesiaType ?? "-"} ({p.anesthesiaMl ?? "-"} ml)
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Extracción: </Text>
                  {formatDateTime(p.extractionStart)} -{" "}
                  {formatDateTime(p.extractionEnd)}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Implantación: </Text>
                  {formatDateTime(p.implantationStart)} -{" "}
                  {formatDateTime(p.implantationEnd)}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Equipo: </Text>
                  {p.medicalTeam ?? "-"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Enfermería: </Text>
                  {p.nurses ?? "-"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Notas: </Text>
                  {p.notes ?? "-"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Observaciones: </Text>
                  {p.observations ?? "-"}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.cellHeader}>{label}</Text>
      <Text style={styles.cell}>{value}</Text>
    </View>
  );
}

function formatDateTime(date: Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString();
}