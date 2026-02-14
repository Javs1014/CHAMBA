
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase'; // Reusing your existing config
import { seedClients } from '../lib/seed-data';
import { seedProducts } from '../lib/seed-data';

// --- IMPORTANT ---
// This script needs credentials for a user that has write permissions.
// For a real application, this would be a user with admin privileges,
// and these credentials should NOT be hardcoded but loaded from a secure source.
const ADMIN_EMAIL = 'admin@aquarius.com'; // Replace with your admin user email
const ADMIN_PASSWORD = 'password123';   // Replace with your admin user password

// Initialize a separate Firebase app for the script
const app = initializeApp(firebaseConfig, 'firestore-seeder');
const db = getFirestore(app);
const auth = getAuth(app);

const clientsCollection = collection(db, 'clients');
const productsCollection = collection(db, 'products');

async function clearCollection(collectionRef: any) {
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) {
        console.log(`Collection ${collectionRef.id} is already empty. No documents to delete.`);
        return;
    }
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} documents from ${collectionRef.id}.`);
}


async function seedDatabase() {
  try {
    console.log(`Attempting to sign in as ${ADMIN_EMAIL}...`);
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Authentication successful. Starting database seed...');

    // --- Clear and Seed Clients ---
    console.log('Preparing to clear and seed clients collection...');
    await clearCollection(clientsCollection);
    const clientBatch = writeBatch(db);
    seedClients.forEach(client => {
      const docRef = doc(clientsCollection);
      const clientData = {
        ...client,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      clientBatch.set(docRef, clientData);
    });
    await clientBatch.commit();
    console.log(`Seeded ${seedClients.length} clients.`);


    // --- Clear and Seed Products ---
    console.log('Preparing to clear and seed products collection...');
    await clearCollection(productsCollection);
    const productBatch = writeBatch(db);
    seedProducts.forEach(product => {
      const docRef = doc(productsCollection);
      const productData = {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      productBatch.set(docRef, productData);
    });
    await productBatch.commit();
    console.log(`Seeded ${seedProducts.length} products.`);


    console.log('Database seeding finished successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
    // It's very important to check for authentication errors specifically
    if (error instanceof Error && 'code' in error) {
        if(error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            console.error('\n*** AUTHENTICATION FAILED ***');
            console.error('Please ensure the ADMIN_EMAIL and ADMIN_PASSWORD in `src/scripts/seed-db.ts` are correct for a user that exists in your Firebase project.');
        }
    }
    process.exit(1);

  } finally {
    // Sign out and exit the process
    await signOut(auth);
    process.exit(0);
  }
}

seedDatabase();
