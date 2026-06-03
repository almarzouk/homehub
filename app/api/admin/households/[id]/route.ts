import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Household from "@/models/Household";
import ChatNachricht from "@/models/ChatNachricht";
import Gericht from "@/models/Gericht";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import Expense from "@/models/Expense";
import Investment from "@/models/Investment";
import HaushaltAufgabe from "@/models/HaushaltAufgabe";
import Termin from "@/models/Termin";
import Wunsch from "@/models/Wunsch";
import Dokument from "@/models/Dokument";
import Medikament from "@/models/Medikament";
import FitnessEintrag from "@/models/FitnessEintrag";
import Reinigung from "@/models/Reinigung";
import Lieferung from "@/models/Lieferung";
import Haustier from "@/models/Haustier";
import Fahrzeug from "@/models/Fahrzeug";
import Energie from "@/models/Energie";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { error };
  const caller = session!.user as { role?: string };
  if (caller.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

// GET /api/admin/households/[id] — full details of one household
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  await connectDB();

  const hh = await Household.findById(id).lean();
  if (!hh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hhId = new mongoose.Types.ObjectId(id);

  // Resolve all member user docs
  const memberIds = hh.members ?? [];
  const memberDocs = await User.find({ _id: { $in: memberIds } })
    .select("_id name email role isBlocked isApproved createdAt")
    .lean();

  const ownerDoc = await User.findById(hh.ownerId).select("_id name email").lean();
  const coAdminIds = (hh.coAdmins ?? []).map((id) => id.toString());

  const members = memberDocs.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isBlocked: u.isBlocked ?? false,
    isApproved: u.isApproved !== false,
    isOwner: hh.ownerId.toString() === u._id.toString(),
    isCoAdmin: coAdminIds.includes(u._id.toString()),
    createdAt: u.createdAt,
  }));

  // Fetch counts and recent data for all modules in parallel
  const [
    chatCount,
    recentChat,
    productCount,
    recentProducts,
    movementCount,
    recentMovements,
    recipeCount,
    recentRecipes,
    expenseCount,
    recentExpenses,
    investmentCount,
    recentInvestments,
    taskCount,
    recentTasks,
    eventCount,
    recentEvents,
    wishCount,
    recentWishes,
    documentCount,
    recentDocuments,
    medicationCount,
    fitnessCount,
    cleaningCount,
    deliveryCount,
    petCount,
    vehicleCount,
    energyCount,
    notificationCount,
    recentNotifications,
  ] = await Promise.all([
    ChatNachricht.countDocuments({ householdId: hhId }),
    ChatNachricht.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(20).select("senderName text createdAt").lean(),
    Product.countDocuments({ householdId: hhId }),
    Product.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("name quantity unit category expiryDate").lean(),
    Movement.countDocuments({ householdId: hhId }),
    Movement.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("type quantity note createdAt").lean(),
    Gericht.countDocuments({ householdId: hhId }),
    Gericht.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("name kategorie schwierigkeitsgrad createdAt").lean(),
    Expense.countDocuments({ householdId: hhId }),
    Expense.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("title amount category date").lean(),
    Investment.countDocuments({ householdId: hhId }),
    Investment.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("name currentValue type").lean(),
    HaushaltAufgabe.countDocuments({ householdId: hhId }),
    HaushaltAufgabe.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("titel status faelligAm assignedTo").lean(),
    Termin.countDocuments({ householdId: hhId }),
    Termin.find({ householdId: hhId }).sort({ startDatum: 1 }).limit(10).select("titel startDatum endDatum").lean(),
    Wunsch.countDocuments({ householdId: hhId }),
    Wunsch.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("titel preis prioritaet erfuellt").lean(),
    Dokument.countDocuments({ householdId: hhId }),
    Dokument.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("titel kategorie createdAt").lean(),
    Medikament.countDocuments({ householdId: hhId }),
    FitnessEintrag.countDocuments({ householdId: hhId }),
    Reinigung.countDocuments({ householdId: hhId }),
    Lieferung.countDocuments({ householdId: hhId }),
    Haustier.countDocuments({ householdId: hhId }),
    Fahrzeug.countDocuments({ householdId: hhId }),
    Energie.countDocuments({ householdId: hhId }),
    Notification.countDocuments({ householdId: hhId }),
    Notification.find({ householdId: hhId }).sort({ createdAt: -1 }).limit(10).select("title body senderName createdAt").lean(),
  ]);

  return NextResponse.json({
    _id: hh._id?.toString(),
    name: hh.name,
    inviteCode: hh.inviteCode,
    createdAt: hh.createdAt,
    owner: ownerDoc
      ? { _id: ownerDoc._id.toString(), name: ownerDoc.name, email: ownerDoc.email }
      : null,
    memberCount: memberIds.length,
    coAdminCount: coAdminIds.length,
    enabledModules: hh.enabledModules ?? [],
    members,
    modules: {
      chat: { count: chatCount, recent: recentChat },
      inventory: { productCount, products: recentProducts, movementCount, movements: recentMovements },
      kitchen: { count: recipeCount, recent: recentRecipes },
      finances: {
        expenseCount,
        expenses: recentExpenses,
        investmentCount,
        investments: recentInvestments,
      },
      tasks: { count: taskCount, recent: recentTasks },
      calendar: { count: eventCount, recent: recentEvents },
      wishes: { count: wishCount, recent: recentWishes },
      documents: { count: documentCount, recent: recentDocuments },
      medications: { count: medicationCount },
      fitness: { count: fitnessCount },
      cleaning: { count: cleaningCount },
      deliveries: { count: deliveryCount },
      pets: { count: petCount },
      vehicles: { count: vehicleCount },
      energy: { count: energyCount },
      notifications: { count: notificationCount, recent: recentNotifications },
    },
  });
}
