import mongoose, { Schema, type Document, Types } from "mongoose";

export interface IImpfung {
  name: string;
  datum: Date;
  naechsteFaelligkeit?: Date;
  tierarzt?: string;
}

export interface IHaustier extends Document {
  householdId: Types.ObjectId;
  name: string;
  tierart: string;
  rasse?: string;
  geschlecht?: "maennlich" | "weiblich" | "unbekannt";
  geburtsdatum?: Date;
  farbe?: string;
  gewicht?: number;
  chipmummer?: string;
  versicherung?: string;
  tierarzt?: string;
  impfungen: IImpfung[];
  naechsterTierarztTermin?: Date;
  notizen?: string;
  createdAt: Date;
  updatedAt: Date;
}

const impfungSchema = new Schema<IImpfung>(
  {
    name: { type: String, required: true, maxlength: 100 },
    datum: { type: Date, required: true },
    naechsteFaelligkeit: { type: Date },
    tierarzt: { type: String, maxlength: 100 },
  },
  { _id: true }
);

const haustierSchema = new Schema<IHaustier>(
  {
    householdId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    tierart: { type: String, required: true, trim: true, maxlength: 40 },
    rasse: { type: String, trim: true, maxlength: 60 },
    geschlecht: { type: String, enum: ["maennlich", "weiblich", "unbekannt"] },
    geburtsdatum: { type: Date },
    farbe: { type: String, trim: true, maxlength: 40 },
    gewicht: { type: Number, min: 0 },
    chipmummer: { type: String, trim: true, maxlength: 30 },
    versicherung: { type: String, trim: true, maxlength: 100 },
    tierarzt: { type: String, trim: true, maxlength: 100 },
    impfungen: { type: [impfungSchema], default: [] },
    naechsterTierarztTermin: { type: Date },
    notizen: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.models.Haustier ?? mongoose.model<IHaustier>("Haustier", haustierSchema);
