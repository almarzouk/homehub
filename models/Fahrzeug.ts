import mongoose, { Schema, type Document, Types } from "mongoose";

export interface IWartungseintrag {
  datum: Date;
  beschreibung: string;
  kosten?: number;
  kilometerstand?: number;
  werkstatt?: string;
}

export interface IFahrzeug extends Document {
  householdId: Types.ObjectId;
  bezeichnung: string;
  kennzeichen?: string;
  marke?: string;
  modell?: string;
  baujahr?: number;
  farbe?: string;
  treibstoff?: "benzin" | "diesel" | "elektro" | "hybrid" | "gas" | "sonstige";
  naechsterTuev?: Date;
  naechsterService?: Date;
  aktuellerKmStand?: number;
  wartungen: IWartungseintrag[];
  notizen?: string;
  createdAt: Date;
  updatedAt: Date;
}

const wartungSchema = new Schema<IWartungseintrag>(
  {
    datum: { type: Date, required: true },
    beschreibung: { type: String, required: true, maxlength: 300 },
    kosten: { type: Number, min: 0 },
    kilometerstand: { type: Number, min: 0 },
    werkstatt: { type: String, maxlength: 100 },
  },
  { _id: true }
);

const fahrzeugSchema = new Schema<IFahrzeug>(
  {
    householdId: { type: Schema.Types.ObjectId, required: true, index: true },
    bezeichnung: { type: String, required: true, trim: true, maxlength: 100 },
    kennzeichen: { type: String, trim: true, maxlength: 20 },
    marke: { type: String, trim: true, maxlength: 60 },
    modell: { type: String, trim: true, maxlength: 60 },
    baujahr: { type: Number, min: 1900, max: 2100 },
    farbe: { type: String, trim: true, maxlength: 40 },
    treibstoff: {
      type: String,
      enum: ["benzin", "diesel", "elektro", "hybrid", "gas", "sonstige"],
    },
    naechsterTuev: { type: Date },
    naechsterService: { type: Date },
    aktuellerKmStand: { type: Number, min: 0 },
    wartungen: { type: [wartungSchema], default: [] },
    notizen: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.models.Fahrzeug ?? mongoose.model<IFahrzeug>("Fahrzeug", fahrzeugSchema);
