<script setup>
import { ref } from "vue";
import apiService from "@/services/apiService";

const paymentMethods = [
  {
    id: "credit_card",
    name: "Credit/Debit Card",
    description: "Pay securely with your card",
    icon: "credit-card",
    available: false,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Pay with your PayPal account",
    icon: "wallet",
    available: false,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    description: "Direct bank transfer",
    icon: "university",
    available: false,
  },
  {
    id: "mobile_payment",
    name: "Mobile Payment",
    description: "Pay with mobile wallet",
    icon: "mobile-alt",
    available: false,
  },
  {
    id: "cash_on_delivery",
    name: "Cash on Delivery",
    description: "Pay when you receive your order",
    icon: "money-bill-wave",
    available: false,
  },
  {
    id: "debug_payment",
    name: "Debug Payment",
    description: "Test payment for development",
    icon: "bug",
    available: true,
  },
];

const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true,
  },
  orderTotal: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["close", "paymentComplete"]);

const isProcessingPayment = ref(false);
const error = ref("");
const selectedMethod = ref(
  paymentMethods.find((m) => m.available)?.id || paymentMethods[0].id,
);

const selectMethod = (method) => {
  if (method.available) {
    selectedMethod.value = method.id;
  }
};

const closePayment = () => {
  emit("close");
};

const processPayment = async () => {
  try {
    isProcessingPayment.value = true;
    error.value = "";

    await apiService.paymentComplete(props.orderId);

    // Emit success event
    emit("paymentComplete");
  } catch (err) {
    console.error("Payment failed:", err);
    error.value = err.message || "Payment failed. Please try again.";
  } finally {
    isProcessingPayment.value = false;
  }
};
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 z-[1000] flex items-stretch justify-center md:items-center md:p-4"
    @click.self="closePayment"
  >
    <div
      class="bg-charcoal flex flex-col shadow-2xl w-full h-screen max-h-screen md:rounded-2xl md:max-w-[500px] md:h-auto md:max-h-[90vh]"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-asphalt-light">
        <h3 class="text-xl md:text-2xl font-semibold text-snow">Complete Payment</h3>
        <button
          @click="closePayment"
          class="bg-transparent border-0 text-2xl text-snow-dim cursor-pointer p-2 flex items-center justify-center transition-colors duration-200 hover:text-snow"
          aria-label="Close payment"
        >
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Order Summary -->
        <div class="bg-asphalt rounded-xl p-4 mb-6">
          <div class="flex justify-between items-center">
            <span class="text-sm text-snow-dim">Order #{{ orderId }}</span>
            <span class="text-sm font-semibold text-snow">${{ orderTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Payment Options -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-snow mb-3">Payment Method</h4>
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            :class="[
              'border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 mb-3 last:mb-0',
              selectedMethod === method.id ? 'border-racket bg-asphalt' : 'border-asphalt-light',
              !method.available ? 'opacity-40 cursor-not-allowed bg-charcoal' : 'hover:border-racket hover:bg-asphalt',
            ]"
            @click="selectMethod(method)"
          >
            <div class="flex items-center gap-3 relative">
              <font-awesome-icon
                :icon="method.icon"
                :class="[
                  'text-2xl',
                  selectedMethod === method.id ? 'text-racket' : !method.available ? 'text-asphalt-muted' : 'text-snow-dim',
                ]"
              />
              <div class="flex-1">
                <p class="font-semibold text-snow m-0">{{ method.name }}</p>
                <p class="text-xs text-snow-dim mt-1 m-0">
                  {{ method.available ? method.description : "Not available" }}
                </p>
              </div>
              <div v-if="selectedMethod === method.id" class="text-racket text-xl">
                <font-awesome-icon icon="check-circle" />
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-danger-surface border border-danger-border rounded-lg p-3">
          <div class="flex items-start gap-2">
            <font-awesome-icon icon="exclamation-circle" class="text-danger mt-0.5" />
            <p class="text-sm text-danger m-0">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-asphalt-light p-6 bg-court md:rounded-b-2xl flex gap-3 flex-col-reverse md:flex-row">
        <button
          @click="closePayment"
          :disabled="isProcessingPayment"
          class="flex-1 py-[0.875rem] px-6 bg-asphalt text-snow-dim border border-asphalt-light rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-asphalt-light hover:text-snow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          @click="processPayment"
          :disabled="isProcessingPayment"
          class="flex-1 py-[0.875rem] px-6 bg-racket text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-racket-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <font-awesome-icon
            v-if="isProcessingPayment"
            icon="spinner"
            class="animate-spin"
          />
          <span>{{ isProcessingPayment ? "Processing..." : "Pay Now" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
