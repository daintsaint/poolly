"use client";

// Re-export BNav as the app's Navbar for backward compatibility.
// layout.tsx no longer renders this (it renders nothing — BNav is included
// per-page), but any legacy import still compiles cleanly.
export { BNav as Navbar } from "@/components/vault-ui";
