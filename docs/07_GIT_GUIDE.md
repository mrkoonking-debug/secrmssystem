# 💾 คู่มือ Git & GitHub — บันทึก ย้อนกลับ และสำรองโค้ด

**Git** คือระบบบันทึกประวัติโค้ด เหมือนกด "Save Checkpoint" ในเกม — ถ้าแก้แล้วพังสามารถย้อนกลับได้ทุกเมื่อ
**GitHub** คือ Cloud ที่เก็บโค้ดไว้อย่างปลอดภัย สามารถสลับทำงานหลายเครื่องได้

> ✅ **โปรเจกต์นี้มี Git + GitHub อยู่แล้ว** — ไม่ต้องตั้งค่าอะไรเพิ่ม

---

## 💡 แนวคิดสำคัญ

```
โค้ดในเครื่อง (Working Directory)
    ↓  git add -A          ← เลือกไฟล์ที่อยากบันทึก
Staging Area
    ↓  git commit -m "..."  ← บันทึก Checkpoint ในเครื่อง
Git History (ในเครื่อง)
    ↓  git push             ← ดันขึ้น GitHub (Cloud)
GitHub (Cloud)
```

---

## 🟢 1. บันทึก Checkpoint (ทำบ่อยๆ)

**ทำทุกครั้งก่อนให้ AI แก้โค้ด หรือหลังจากแก้เสร็จทดสอบว่า OK**

```bash
git add -A && git commit -m "ข้อความอธิบายสิ่งที่ทำ"
```

ตัวอย่าง:
```bash
git add -A && git commit -m "แก้หน้าค้นหา + เพิ่ม validation"
```

---

## 🔄 2. กฎทองสำหรับสลับเครื่อง

> จำง่ายๆ: **"ดึงก่อนเริ่ม ดันก่อนเลิก"**

### 🟢 ก่อนเริ่มงาน — ดึงโค้ดล่าสุด
```bash
git pull
```

### 🔴 เลิกงาน — เซฟและดันขึ้น
```bash
git add -A
git commit -m "อัปเดต: [สิ่งที่ทำ]"
git push
```

> 💡 **วัฏจักร:** เปิดคอม → `git pull` → ทำงาน → `git add -A && git commit -m "..." && git push` → ปิดคอม

---

## 🔍 3. ดูประวัติ Checkpoint

```bash
git log --oneline
```

ผลลัพธ์:
```
7fad46b (HEAD -> main) refactor: cleanup unused files
74d03c0 fix: แก้หน้า Dashboard
03b0581 feat: เพิ่มระบบ validation
```

---

## ⏪ 4. ย้อนกลับโค้ด

### แก้ไปแล้วแต่ยังไม่ commit — อยากยกเลิกทั้งหมด
```bash
git restore .
```
> ⚠️ อันตราย: ลบการแก้ไขทั้งหมดกลับเป็น commit ล่าสุด ไม่สามารถกู้คืนได้

### ย้อนกลับแค่ไฟล์เดียว
```bash
git checkout 74d03c0 -- pages/CustomerStatus.tsx
git add -A && git commit -m "revert: คืน CustomerStatus.tsx"
```

### ย้อนกลับทั้งโปรเจกต์ (ระวัง!)
```bash
git log --oneline            # ดู ID ก่อน
git reset --soft 74d03c0     # ย้อน เก็บไฟล์ไว้
git reset --hard 74d03c0     # ย้อน + ลบทิ้งหมดเลย ⛔
```

---

## 🏷️ 5. ตั้ง Tag (Bookmark version สำคัญ)

```bash
git tag v1.0 -m "Version แรกที่ใช้งานจริง"
git tag                      # ดู Tag ทั้งหมด
git checkout v1.0            # ย้อนกลับไปที่ Tag
```

---

## 💻 6. ดึงโปรเจกต์ลงเครื่องใหม่ (ครั้งแรก)

1. ติดตั้ง **Git** ([git-scm.com](https://git-scm.com)) + **Node.js LTS** ([nodejs.org](https://nodejs.org)) + **VS Code**
2. เปิด Terminal ใน VS Code แล้วรัน:
```bash
git clone https://github.com/mrkoonking-debug/secrmssystem.git
cd secrmssystem
npm install
npm run dev
```

---

## 📋 คำสั่งสรุป

| คำสั่ง | หน้าที่ |
| :--- | :--- |
| `git status` | ดูไฟล์ที่เปลี่ยนแปลง |
| `git log --oneline` | ดูประวัติ Checkpoint |
| `git add -A` | เพิ่มทุกไฟล์เข้า Staging |
| `git commit -m "..."` | บันทึก Checkpoint |
| `git push` | ดันขึ้น GitHub |
| `git pull` | ดึงล่าสุดจาก GitHub |
| `git restore .` | ยกเลิกการแก้ไข (ก่อน commit) |
| `git checkout ID -- file` | คืนไฟล์เดียวจาก checkpoint |
| `git reset --hard ID` | ย้อนทั้งโปรเจกต์ (อันตราย!) |
| `git tag v1.0` | ตั้ง bookmark version |

---

*อัปเดตล่าสุด มีนาคม 2026*
