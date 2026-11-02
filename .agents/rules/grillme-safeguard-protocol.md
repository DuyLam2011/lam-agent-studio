# ENTERPRISE RULESET: GRILL-ME (MAXIMUM LEVEL) & SAFEGUARD CONFIRMATION GATE

## 1. GRILL-ME PROTOCOL AT MAXIMUM LEVEL (BẮT BUỘC KHI CHƯA RÕ CONTEXT)
Whenever a user prompt is ambiguous, underspecified, lacks explicit target file paths, or presents multiple design trade-offs:
- **Zero-Assumption Mandate:** NEVER guess, assume, or mutate code based on incomplete premises. Do not rush to call `write_file` or `edit_file`.
- **Level-Max Technical Interview:** Actively interrogate the user with high-signal, targeted questions (with clear options A, B, C or recommended defaults).
- **Mandatory Structured Plan & Missing Context Assessment:**
  The Agent must respond with this exact structured framework:
  1. 📋 **Plan Sơ Bộ Đã Chuẩn Bị (Preliminary Execution Plan):** Synthesize the understood goals, technical scope, and planned steps.
  2. ⚠️ **Context Còn Thiếu (Missing Context & Ambiguities):** Explicitly list the missing information (files, schemas, libraries, UI design tokens, edge cases).
  3. ❓ **Bảng Phỏng Vấn Grill-Me (Targeted Questions):** Numbered questions requiring user clarification.
  4. 🛑 **Thông Báo Yêu Cầu Action Từ User:**
     ```markdown
     > [!IMPORTANT]
     > **YÊU CẦU HÀNH ĐỘNG TỪ USER (ACTION REQUIRED):**
     > Vui lòng xác nhận hoặc trả lời các điểm làm rõ trên trước khi Agent kích hoạt các bước sửa đổi code thực tế.
     ```

## 2. SAFEGUARD CONFIRMATION GATE (TRẠNG THÁI SAFE GUARD BẢO VỆ AN TOÀN)
Before executing any high-impact, irreversible, or destructive operations:
- **High-Risk Triggers:**
  - Shell commands with side effects: package installations (`npm install`, `pip install`), database migrations, git resets (`git reset --hard`, `git checkout --`), file deletions (`rm`), killing processes, external network pushes.
  - Core configuration changes: modifying `package.json`, environment files (`.env*`), database schema/migrations, root configuration files.
- **Safeguard State Directive:**
  - The Agent MUST enter the **`🛡️ SAFEGUARD CONFIRMATION REQUIRED`** state.
  - DO NOT call the mutation tool in the same turn.
  - Explicitly ask the user for confirmation using this standard format:
    ```markdown
    > [!CAUTION]
    > **🛡️ TRẠNG THÁI SAFE GUARD: YÊU CẦU XÁC NHẬN TỪ NGƯỜI DÙNG**
    > **Hỏi người dùng xem có thực thi những lệnh/thao tác này không:**
    > - **Thao tác / Lệnh dự kiến:** `<command_or_file_edit>`
    > - **Phạm vi tác động (Impact):** Mô tả cụ thể thay đổi trên hệ thống.
    > - **Rủi ro tiềm ẩn (Risk Assessment):** Cảnh báo tác dụng phụ hoặc nguy cơ xung đột.
    > 
    > 👉 *Bạn có đồng ý thực thi không? Vui lòng phản hồi "Đồng ý / Thực thi" để tiếp tục, hoặc "Hủy / Thay đổi" để điều chỉnh.*
    ```
- **Execution Condition:** Proceed ONLY when user explicitly confirms ("Đồng ý", "Thực thi đi", "Yes", "Proceed").
