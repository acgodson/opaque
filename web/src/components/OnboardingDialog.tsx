"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "opaque_onboarding_completed";

export function OnboardingDialog() {
  const [isOpen, setIsOpen] = useState(true);
  const [showClose, setShowClose] = useState(false);
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const currentSlideRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !slidesContainerRef.current) return;

    const container = slidesContainerRef.current;
    
    const slidesHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .onboarding-slide-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .onboarding-slide {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          transition: opacity 0.6s ease;
          pointer-events: none;
        }

        .onboarding-slide.active {
          opacity: 1;
          pointer-events: auto;
        }

        .onboarding-grid-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0, 255, 200, 0.03) 49px, rgba(0, 255, 200, 0.03) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(0, 255, 200, 0.03) 49px, rgba(0, 255, 200, 0.03) 50px);
          animation: gridPulse 4s ease-in-out infinite;
        }

        @keyframes gridPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .onboarding-gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: background 0.8s ease;
        }

        .onboarding-slide-0 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 20% 30%, rgba(0, 255, 200, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
        }

        .onboarding-slide-1 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 30% 40%, rgba(0, 191, 255, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
        }

        .onboarding-slide-2 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 70% 30%, rgba(0, 255, 150, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a1419 0%, #1a2f32 100%);
        }

        .onboarding-slide-3 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 70% 30%, rgba(255, 107, 53, 0.12) 0%, transparent 50%),
            linear-gradient(135deg, #1a0f0a 0%, #2a1f1a 100%);
        }

        .onboarding-slide-4 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 70% 30%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 70%, rgba(200, 50, 50, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #1a0f0a 0%, #2a1515 100%);
        }

        .onboarding-slide-5 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 30% 20%, rgba(0, 255, 200, 0.18) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
        }

        .onboarding-slide-6 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 50% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, rgba(0, 255, 200, 0.15) 0%, transparent 40%),
            linear-gradient(135deg, #0a0e1a 0%, #1a1535 100%);
        }

        .onboarding-slide-7 .onboarding-gradient-overlay {
          background: radial-gradient(ellipse at 50% 30%, rgba(0, 255, 200, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 70%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 70%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
        }

        .onboarding-content {
          position: relative;
          z-index: 10;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 40px 50px;
          overflow-y: auto;
        }

        .onboarding-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 80px;
          font-weight: 900;
          background: linear-gradient(135deg, #00ffc8 0%, #00d4ff 50%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -2px;
          margin-bottom: 20px;
          animation: titleGlow 3s ease-in-out infinite;
        }

        @keyframes titleGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(0, 255, 200, 0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(0, 255, 200, 0.6)); }
        }

        .onboarding-subtitle {
          font-size: 24px;
          color: #00ffc8;
          font-weight: 300;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }

        .onboarding-footer {
          margin-top: auto;
          padding-top: 30px;
          border-top: 1px solid rgba(0, 255, 200, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .onboarding-footer-text {
          font-size: 16px;
          color: #6b7b8b;
          font-weight: 400;
        }

        .onboarding-slide-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 20px;
          color: #00ffc8;
          font-weight: 700;
        }

        .onboarding-nav-buttons {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 100;
          display: flex;
          gap: 15px;
        }

        .onboarding-nav-btn {
          width: 45px;
          height: 45px;
          border: 2px solid #00ffc8;
          background: rgba(0, 255, 200, 0.1);
          color: #00ffc8;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          border-radius: 4px;
        }

        .onboarding-nav-btn:hover {
          background: rgba(0, 255, 200, 0.3);
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.5);
          transform: scale(1.1);
        }

        .onboarding-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      </style>
      <div class="onboarding-slide-container">
        <div class="onboarding-slide active onboarding-slide-0">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="margin-bottom: auto;">
              <div class="onboarding-title">opaque</div>
              <div class="onboarding-subtitle">Policy-Governed Execution for MetaMask Advanced Permissions</div>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">MetaMask Advanced Permissions Dev Cook-Off<br>Jan 2026</div>
              <div class="onboarding-slide-number">00</div>
            </div>
          </div>
        </div>
        <div class="onboarding-slide onboarding-slide-1">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="margin-bottom: 60px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 40px; font-weight: 700; color: #00ffc8; margin-bottom: 30px;">MetaMask Advanced Permissions</div>
            </div>
            <div style="flex: 1;">
              <ul style="list-style: none; padding: 0;">
                <li style="font-size: 28px; color: #e0e8f0; margin-bottom: 30px; padding-left: 40px; position: relative; line-height: 1.4;">
                  <span style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #00ffc8; box-shadow: 0 0 15px rgba(0, 255, 200, 0.8);"></span>
                  User-authorised delegation (ERC-7715)
                </li>
                <li style="font-size: 28px; color: #e0e8f0; margin-bottom: 30px; padding-left: 40px; position: relative; line-height: 1.4;">
                  <span style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #00ffc8; box-shadow: 0 0 15px rgba(0, 255, 200, 0.8);"></span>
                  Scope definition
                </li>
                <li style="font-size: 28px; color: #e0e8f0; margin-bottom: 30px; padding-left: 40px; position: relative; line-height: 1.4;">
                  <span style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #00ffc8; box-shadow: 0 0 15px rgba(0, 255, 200, 0.8);"></span>
                  Non-custodial by design
                </li>
              </ul>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">MetaMask Advanced Permissions Dev Cook-Off • Jan 2026</div>
              <div class="onboarding-slide-number">01</div>
            </div>
          </div>
        </div>
        <div class="onboarding-slide onboarding-slide-2">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="margin-bottom: 60px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 40px; font-weight: 700; color: #00ffc8; margin-bottom: 30px;">MetaMask Advanced Permissions</div>
            </div>
            <div style="flex: 1; display: flex; gap: 40px; align-items: center;">
              <div style="flex: 1;">
                <ul style="list-style: none; padding: 0;">
                  <li style="font-size: 28px; color: #e0e8f0; margin-bottom: 30px; padding-left: 40px; position: relative; line-height: 1.4;">
                    <span style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #00ffc8; box-shadow: 0 0 15px rgba(0, 255, 200, 0.8);"></span>
                    User-authorised delegation (ERC-7715)
                  </li>
                  <li style="font-size: 28px; color: #e0e8f0; margin-bottom: 30px; padding-left: 40px; position: relative; line-height: 1.4;">
                    <span style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #00ffc8; box-shadow: 0 0 15px rgba(0, 255, 200, 0.8);"></span>
                    Scope definition
                  </li>
                  <li style="font-size: 28px; color: #e0e8f0; margin-bottom: 30px; padding-left: 40px; position: relative; line-height: 1.4;">
                    <span style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #00ffc8; box-shadow: 0 0 15px rgba(0, 255, 200, 0.8);"></span>
                    Non-custodial by design
                  </li>
                </ul>
              </div>
              <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                <div style="background: rgba(0, 255, 200, 0.05); border: 2px solid #00ffc8; padding: 30px; border-radius: 8px; box-shadow: 0 0 40px rgba(0, 255, 200, 0.2);">
                  <div style="font-size: 24px; color: #e0e8f0; text-align: center; line-height: 1.5;">
                    <strong style="color: #00ffc8; font-weight: 700;">Permission granted</strong><br>
                    → execution is automatic.
                  </div>
                </div>
              </div>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">MetaMask Advanced Permissions Dev Cook-Off • Jan 2026</div>
              <div class="onboarding-slide-number">02</div>
            </div>
          </div>
        </div>
        <div class="onboarding-slide onboarding-slide-3">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="margin-bottom: 60px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 40px; font-weight: 700; color: #00ffc8; margin-bottom: 30px;">MetaMask Advanced Permissions</div>
            </div>
            <div style="flex: 1; display: flex; gap: 40px; align-items: center;">
              <div style="flex: 1;">
                <div style="background: rgba(0, 255, 200, 0.05); border: 2px solid #00ffc8; padding: 30px; border-radius: 8px; box-shadow: 0 0 40px rgba(0, 255, 200, 0.2);">
                  <div style="font-size: 24px; color: #e0e8f0; text-align: center; line-height: 1.5;">
                    <strong style="color: #00ffc8; font-weight: 700;">Permission granted</strong><br>
                    → execution is automatic.
                  </div>
                </div>
              </div>
              <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; padding: 30px;">
                  <div style="font-size: 30px; color: #ff6b35; font-weight: 600; line-height: 1.5; font-style: italic;">
                    "No runtime evaluation.<br>No guardrails."
                  </div>
                </div>
              </div>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">MetaMask Advanced Permissions Dev Cook-Off • Jan 2026</div>
              <div class="onboarding-slide-number">03</div>
            </div>
          </div>
        </div>
        <div class="onboarding-slide onboarding-slide-4">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="margin-bottom: 60px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 40px; font-weight: 700; color: #00ffc8; margin-bottom: 30px;">MetaMask Advanced Permissions</div>
            </div>
            <div style="flex: 1; display: flex; gap: 40px; align-items: center;">
              <div style="flex: 1;">
                <div style="background: rgba(0, 255, 200, 0.05); border: 2px solid #00ffc8; padding: 30px; border-radius: 8px; box-shadow: 0 0 40px rgba(0, 255, 200, 0.2);">
                  <div style="font-size: 24px; color: #e0e8f0; text-align: center; line-height: 1.5;">
                    <strong style="color: #00ffc8; font-weight: 700;">Permission granted</strong><br>
                    → execution is automatic.
                  </div>
                </div>
              </div>
              <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; padding: 30px;">
                  <div style="font-size: 28px; line-height: 1.6;">
                    <span style="color: #ff6b35; font-weight: 700; font-size: 32px;">Perpetual monitoring?</span><br>
                    <span style="color: #ff8c5a; font-weight: 500; font-size: 26px; font-style: italic;">Eternal trust in the signer?</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">MetaMask Advanced Permissions Dev Cook-Off • Jan 2026</div>
              <div class="onboarding-slide-number">04</div>
            </div>
          </div>
        </div>
        <div class="onboarding-slide onboarding-slide-5">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="margin-bottom: 60px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 40px; font-weight: 700; color: #00ffc8; margin-bottom: 30px;">opaque</div>
              <div style="font-size: 24px; color: #a0b0c0; font-weight: 400;">What Do Users Need to Trust Automation?</div>
            </div>
            <div style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; padding: 0 20px;">
              <div style="background: rgba(0, 255, 200, 0.03); border: 2px solid rgba(0, 255, 200, 0.3); padding: 30px; border-radius: 8px; text-align: center;">
                <div style="font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 700; color: #00d4ff; margin-bottom: 15px;">Adapters</div>
                <div style="font-size: 20px; color: #00ffc8; margin: 10px 0;">→</div>
                <div style="font-size: 18px; color: #e0e8f0; line-height: 1.5;">Defines<br><strong style="color: #00d4ff;">what</strong> will happen</div>
              </div>
              <div style="background: rgba(0, 255, 200, 0.03); border: 2px solid rgba(168, 85, 247, 0.3); padding: 30px; border-radius: 8px; text-align: center;">
                <div style="font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 700; color: #a855f7; margin-bottom: 15px;">Policies</div>
                <div style="font-size: 20px; color: #a855f7; margin: 10px 0;">→</div>
                <div style="font-size: 18px; color: #e0e8f0; line-height: 1.5;"><strong style="color: #a855f7;">When</strong> it's allowed</div>
              </div>
              <div style="background: rgba(0, 255, 200, 0.03); border: 2px solid rgba(0, 255, 200, 0.3); padding: 30px; border-radius: 8px; text-align: center;">
                <div style="font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 700; color: #00ffc8; margin-bottom: 15px;">Signals</div>
                <div style="font-size: 20px; color: #00ffc8; margin: 10px 0;">←</div>
                <div style="font-size: 18px; color: #e0e8f0; line-height: 1.5;">Context for policies</div>
              </div>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">MetaMask Advanced Permissions Dev Cook-Off • Jan 2026</div>
              <div class="onboarding-slide-number">05</div>
            </div>
          </div>
        </div>
        <div class="onboarding-slide onboarding-slide-6">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="margin-bottom: 40px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 40px; font-weight: 700; color: #00ffc8; margin-bottom: 30px;">EXECUTION FLOW</div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; padding-right: 20px;">
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="min-width: 45px; height: 45px; border-radius: 50%; background: rgba(0, 255, 200, 0.2); border: 2px solid #00ffc8; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 700; color: #00ffc8;">1</div>
                <div style="flex: 1; background: rgba(0, 255, 200, 0.03); border: 1px solid rgba(0, 255, 200, 0.2); padding: 15px 25px; border-radius: 6px;">
                  <div style="font-size: 20px; color: #e0e8f0; font-weight: 400;">Install Adapter & Configure Policy</div>
                </div>
              </div>
              <div style="font-size: 28px; color: #00ffc8; text-align: center; padding: 0; margin: 0;">↓</div>
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="min-width: 45px; height: 45px; border-radius: 50%; background: rgba(168, 85, 247, 0.2); border: 2px solid #a855f7; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 700; color: #a855f7; box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);">2</div>
                <div style="flex: 1; background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); padding: 15px 25px; border-radius: 6px;">
                  <div style="font-size: 20px; color: #e0e8f0; font-weight: 400;">Provision Signer in <strong style="color: #a855f7;">Enclave</strong></div>
                </div>
              </div>
              <div style="font-size: 28px; color: #00ffc8; text-align: center; padding: 0; margin: 0;">↓</div>
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="min-width: 45px; height: 45px; border-radius: 50%; background: rgba(0, 255, 200, 0.2); border: 2px solid #00ffc8; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 700; color: #00ffc8;">3</div>
                <div style="flex: 1; background: rgba(0, 255, 200, 0.03); border: 1px solid rgba(0, 255, 200, 0.2); padding: 15px 25px; border-radius: 6px;">
                  <div style="font-size: 20px; color: #e0e8f0; font-weight: 400;">Adapter proposes TX → Policy Engine</div>
                </div>
              </div>
              <div style="font-size: 28px; color: #00ffc8; text-align: center; padding: 0; margin: 0;">↓</div>
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="min-width: 45px; height: 45px; border-radius: 50%; background: rgba(0, 255, 200, 0.2); border: 2px solid #00ffc8; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 700; color: #00ffc8;">4</div>
                <div style="flex: 1; background: rgba(0, 255, 200, 0.03); border: 1px solid rgba(0, 255, 200, 0.2); padding: 15px 25px; border-radius: 6px;">
                  <div style="font-size: 18px; color: #b0c0d0; margin-bottom: 10px;">Signals fetched & supplied to context</div>
                </div>
              </div>
              <div style="font-size: 28px; color: #00ffc8; text-align: center; padding: 0; margin: 0;">↓</div>
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="min-width: 45px; height: 45px; border-radius: 50%; background: rgba(0, 255, 200, 0.2); border: 2px solid #00ffc8; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 700; color: #00ffc8;">5</div>
                <div style="flex: 1; background: rgba(0, 255, 200, 0.03); border: 1px solid rgba(0, 255, 200, 0.2); padding: 15px 25px; border-radius: 6px;">
                  <div style="font-size: 20px; color: #e0e8f0; font-weight: 400;">Policies Evaluated ✓</div>
                </div>
              </div>
              <div style="font-size: 28px; color: #00ffc8; text-align: center; padding: 0; margin: 0;">↓</div>
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="min-width: 45px; height: 45px; border-radius: 50%; background: rgba(168, 85, 247, 0.2); border: 2px solid #a855f7; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 700; color: #a855f7; box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);">6</div>
                <div style="flex: 1; background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); padding: 15px 25px; border-radius: 6px;">
                  <div style="font-size: 20px; color: #e0e8f0; font-weight: 400;"><strong style="color: #a855f7;">Enclave</strong> signs UserOperation Session</div>
                </div>
              </div>
              <div style="font-size: 28px; color: #00ffc8; text-align: center; padding: 0; margin: 0;">↓</div>
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="min-width: 45px; height: 45px; border-radius: 50%; background: rgba(0, 255, 200, 0.3); border: 2px solid #00ffc8; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 700; color: #00ffc8; box-shadow: 0 0 25px rgba(0, 255, 200, 0.6);">7</div>
                <div style="flex: 1; background: rgba(0, 255, 200, 0.08); border: 1px solid rgba(0, 255, 200, 0.4); padding: 15px 25px; border-radius: 6px;">
                  <div style="font-size: 20px; color: #e0e8f0; font-weight: 400;">Broadcast Transaction <strong style="color: #00ffc8;">On-Chain</strong></div>
                </div>
              </div>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">MetaMask Advanced Permissions Dev Cook-Off • Jan 2026</div>
              <div class="onboarding-slide-number">06</div>
            </div>
          </div>
        </div>
        <div class="onboarding-slide onboarding-slide-7">
          <div class="onboarding-grid-bg"></div>
          <div class="onboarding-gradient-overlay"></div>
          <div class="onboarding-content">
            <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 40px;">
              <div style="text-align: center;">
                <div style="background: linear-gradient(135deg, rgba(0, 255, 200, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%); border: 3px solid; border-image: linear-gradient(135deg, #00ffc8, #a855f7) 1; padding: 30px; border-radius: 12px; max-width: 700px; margin: 0 auto; transition: all 0.3s ease;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px;">
                    <svg style="width: 40px; height: 40px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="#e0e8f0" />
                    </svg>
                    <span style="font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 700; color: #e0e8f0;">Open Source</span>
                  </div>
                  <a href="https://github.com/acgodson/opaque" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 24px; color: #00ffc8; text-decoration: none; font-weight: 600; transition: all 0.3s ease;">
                    github.com/acgodson/opaque
                    <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                  </a>
                </div>
              </div>

              <div style="text-align: center;">
                <div style="font-family: 'Orbitron', sans-serif; font-size: 28px; color: #e0e8f0; font-weight: 700; margin-bottom: 25px;">Resources</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; max-width: 800px; margin: 0 auto;">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 15px; background: rgba(0, 255, 200, 0.03); border: 1px solid rgba(0, 255, 200, 0.2); border-radius: 8px; transition: all 0.3s ease; cursor: pointer;">
                    <svg style="width: 40px; height: 40px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="#00d4ff" stroke-width="2" />
                      <path d="M9 9h6M9 13h6M9 17h4" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <span style="font-size: 16px; color: #e0e8f0; font-weight: 500; text-align: center;">How to Create Adapters</span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 15px; background: rgba(0, 255, 200, 0.03); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 8px; transition: all 0.3s ease; cursor: pointer;">
                    <svg style="width: 40px; height: 40px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="#a855f7" stroke-width="2" />
                      <path d="M14 2v6h6M12 13v6M9 16h6" stroke="#a855f7" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <span style="font-size: 16px; color: #e0e8f0; font-weight: 500; text-align: center;">Policies DSL</span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 15px; background: rgba(0, 255, 200, 0.03); border: 1px solid rgba(0, 255, 200, 0.2); border-radius: 8px; transition: all 0.3s ease; cursor: pointer;">
                    <svg style="width: 40px; height: 40px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" fill="none" stroke="#00ffc8" stroke-width="2" stroke-linecap="round" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="none" stroke="#00ffc8" stroke-width="2" />
                    </svg>
                    <span style="font-size: 16px; color: #e0e8f0; font-weight: 500; text-align: center;">References</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="onboarding-footer">
              <div class="onboarding-footer-text">Tinybird • Jan 2026</div>
              <div class="onboarding-slide-number">07</div>
            </div>
          </div>
        </div>
      </div>
      <div class="onboarding-nav-buttons">
        <button class="onboarding-nav-btn" id="onboardingPrevBtn">←</button>
        <button class="onboarding-nav-btn" id="onboardingNextBtn">→</button>
      </div>
    `;

    container.innerHTML = slidesHTML;

    const slides = container.querySelectorAll('.onboarding-slide');
    const prevBtn = container.querySelector('#onboardingPrevBtn') as HTMLButtonElement;
    const nextBtn = container.querySelector('#onboardingNextBtn') as HTMLButtonElement;

    const showSlide = (n: number) => {
      slides.forEach((slide, index) => {
        if (index === n) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      if (prevBtn) prevBtn.disabled = n === 0;
      if (nextBtn) nextBtn.disabled = n === slides.length - 1;

      currentSlideRef.current = n;
      
      if (n === 7) {
        setShowClose(true);
      } else {
        setShowClose(false);
      }
    };

    const changeSlide = (direction: number) => {
      let newSlide = currentSlideRef.current + direction;
      if (newSlide < 0) newSlide = 0;
      if (newSlide >= slides.length) newSlide = slides.length - 1;
      showSlide(newSlide);
    };

    if (prevBtn) {
      prevBtn.onclick = () => changeSlide(-1);
    }
    if (nextBtn) {
      nextBtn.onclick = () => changeSlide(1);
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') changeSlide(-1);
      if (e.key === 'ArrowRight') changeSlide(1);
    };

    document.addEventListener('keydown', handleKeydown);
    showSlide(0);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      <div 
        className="relative bg-[#0a0e1a] rounded-lg shadow-2xl overflow-hidden transition-all duration-300 w-full h-full md:w-[50vw] md:h-[80vh] md:max-w-[1200px] md:max-h-[800px]"
        style={{
          animation: 'fadeIn 0.3s ease-out, slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="absolute top-4 right-4 z-[10000] cursor-pointer hover:opacity-80 transition-opacity"
          style={{ display: showClose ? 'block' : 'none' }}
        >
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div 
          ref={slidesContainerRef}
          className="w-full h-full"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        />
      </div>
    </div>
    </>
  );
}

