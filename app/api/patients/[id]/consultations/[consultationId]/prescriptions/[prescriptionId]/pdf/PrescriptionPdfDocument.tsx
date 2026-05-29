import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type Clinic = {
  name: string;
  logoUrl: string | null;
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

  doctorName: string | null;
  doctorLicense: string | null;
  doctorPhone: string | null;

  patient: {
    firstName: string;
    lastName: string | null;
    birthDate: Date | null;
    gender: string | null;
  };

  items: PrescriptionItem[];
};

type Props = {
  clinic: Clinic;
  prescription: Prescription;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: "#111827",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 12,
  },

  clinicInfo: {
    flex: 1,
  },

  clinicName: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },

  logo: {
    width: 100,
    height: 50,
    objectFit: "contain",
  },

  recipeTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 14,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
  },

  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  cellHeader: {
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
  },

  cell: {
    padding: 6,
    fontSize: 9,
  },

  medicationCol: {
    flex: 2,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },

  presentationCol: {
    flex: 2,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },

  dosageCol: {
    flex: 1.5,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },

  frequencyCol: {
    flex: 1.5,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },

  durationCol: {
    flex: 1.5,
  },

  medicationBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },

  medicationTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },

  notesBox: {
    marginTop: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 9,
    color: "#6B7280",
  },

  signatureBox: {
    marginTop: 40,
    alignItems: "center",
  },

  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#111827",
    marginBottom: 6,
  },
});

export default function PrescriptionPdfDocument({
  clinic,
  prescription,
}: Props) {
  const patientName = `${prescription.patient.firstName} ${
    prescription.patient.lastName ?? ""
  }`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>{clinic.name}</Text>

            <Text>
              Fecha:{" "}
              {new Date(prescription.date).toLocaleDateString()}
            </Text>
          </View>

          {clinic.logoUrl && (
            <Image
              src={clinic.logoUrl}
              style={styles.logo}
            />
          )}
        </View>

        {/* TITULO */}

        <View style={styles.section}>
          <Text style={styles.recipeTitle}>
            RECETA MÉDICA
          </Text>
        </View>

        {/* PACIENTE */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Datos del paciente
          </Text>

          <Text style={styles.row}>
            <Text style={styles.bold}>Nombre:</Text>{" "}
            {patientName}
          </Text>

          <Text style={styles.row}>
            <Text style={styles.bold}>Fecha de nacimiento:</Text>{" "}
            {prescription.patient.birthDate
              ? new Date(
                  prescription.patient.birthDate
                ).toLocaleDateString()
              : "-"}
          </Text>

          <Text style={styles.row}>
            <Text style={styles.bold}>Género:</Text>{" "}
            {prescription.patient.gender ?? "-"}
          </Text>
        </View>

        {/* DIAGNOSTICO */}

        {prescription.diagnosis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Diagnóstico
            </Text>

            <Text>{prescription.diagnosis}</Text>
          </View>
        )}

        {/* MEDICAMENTOS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Medicamentos prescritos
          </Text>

          {prescription.items.map((item, index) => (
            <View
              key={item.id}
              style={styles.medicationBox}
            >
              <Text style={styles.medicationTitle}>
                {index + 1}. {item.medication}
              </Text>

              {item.presentation && (
                <Text style={styles.row}>
                  <Text style={styles.bold}>
                    Presentación:
                  </Text>{" "}
                  {item.presentation}
                </Text>
              )}

              {item.dosage && (
                <Text style={styles.row}>
                  <Text style={styles.bold}>
                    Dosis:
                  </Text>{" "}
                  {item.dosage}
                </Text>
              )}

              {item.frequency && (
                <Text style={styles.row}>
                  <Text style={styles.bold}>
                    Frecuencia:
                  </Text>{" "}
                  {item.frequency}
                </Text>
              )}

              {item.duration && (
                <Text style={styles.row}>
                  <Text style={styles.bold}>
                    Duración:
                  </Text>{" "}
                  {item.duration}
                </Text>
              )}

              {item.indications && (
                <Text style={styles.row}>
                  <Text style={styles.bold}>
                    Indicaciones:
                  </Text>{" "}
                  {item.indications}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* NOTAS */}

        {prescription.generalNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.bold}>
              Notas generales
            </Text>

            <Text style={{ marginTop: 6 }}>
              {prescription.generalNotes}
            </Text>
          </View>
        )}

        {/* FIRMA */}

        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />

          <Text>
            {prescription.doctorName || "Médico tratante"}
          </Text>

          {prescription.doctorLicense && (
            <Text>
              Cédula: {prescription.doctorLicense}
            </Text>
          )}

          {prescription.doctorPhone && (
            <Text>
              Tel: {prescription.doctorPhone}
            </Text>
          )}
        </View>

        {/* FOOTER */}

        <Text style={styles.footer}>
          Documento generado por CapilTrack
        </Text>
      </Page>
    </Document>
  );
}