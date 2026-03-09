# 💾 คู่มือ Git — บันทึกและย้อนกลับโค้ด

**Git** คือระบบบันทึกประวัติโค้ด เหมือนกด "Save Checkpoint" ในเกม — ถ้าแก้แล้วพังสามารถย้อนกลับได้ทุกเมื่อ

> ✅ **โปรเจกต์นี้มี Git อยู่แล้ว** — ไม่ต้องติดตั้งอะไรเพิ่ม

---

## 💡 แนวคิดสำคัญ (เข้าใจก่อนใช้)

```
โค้ดในเครื่อง (Working Directory)
    ↓  git add -A          ← เลือกไฟล์ที่อยากบันทึก
Staging Area
    ↓  git commit -m "..."  ← บันทึกเป็น Checkpoint พร้อมข้อความ
ประวัติ (Git History)        ← ย้อนกลับมาจุดใดก็ได้
```

---

## 🟢 วิธีบันทึก Checkpoint (Commit)

**ทำทุกครั้งก่อนให้ AI แก้โค้ด หรือหลังจากแก้เสร็จแล้วทดสอบว่า OK**

```bash
# ขั้นตอนที่ 1: ดูว่ามีไฟล์ไหนเปลี่ยนแปลงบ้าง
git status

# ขั้นตอนที่ 2: เพิ่มไฟล์ทั้งหมดเข้า Staging
git add -A

# ขั้นตอนที่ 3: บันทึกพร้อมข้อความ (เขียนอธิบายว่าทำอะไรไป)
git commit -m "แก้หน้าค้นหา + เพิ่มคู่มือ docs"
```

**หรือรวมทีเดียวในคำสั่งเดียว:**
```bash
git add -A && git commit -m "ข้อความอธิบาย"
```

---

## 🔍 วิธีดูประวัติทั้งหมด

```bash
git log --oneline
```

ผลลัพธ์ที่เห็น:
```
7fad46b (HEAD -> main) refactor: cleanup unused files, reorganize docs/
74d03c0 87%
03b0581 86%
fb6ac5c 86%
...
```

- รหัสทางซ้าย (เช่น `7fad46b`) คือ ID ของแต่ละ Checkpoint
- `HEAD -> main` = ตอนนี้คุณอยู่ที่ Checkpoint ล่าสุด

---

## ⏪ วิธีย้อนกลับโค้ด

### กรณีที่ 1: แก้โค้ดไปแล้ว แต่ยังไม่ได้ commit — อยากยกเลิกทั้งหมด

```bash
git restore .
```
> ⚠️ อันตราย: คืนค่าทุกอย่างกลับเป็น commit ล่าสุด ไม่สามารถ Undo ได้

---

### กรณีที่ 2: commit ไปแล้ว แต่อยากดูว่าโค้ดเก่าหน้าตาเป็นยังไง

```bash
# ดูประวัติก่อน
git log --oneline

# ดูโค้ดของ checkpoint นั้น (แค่ดู ไม่ได้เปลี่ยน)
git show 74d03c0:pages/CustomerStatus.tsx
```

---

### กรณีที่ 3: อยากย้อนกลับไปใช้ไฟล์เก่าจาก Checkpoint ที่ผ่านมา

```bash
# ย้อนกลับแค่ไฟล์เดียว (ปลอดภัยกว่า)
git checkout 74d03c0 -- pages/CustomerStatus.tsx

# จากนั้น commit ใหม่เพื่อบันทึกการย้อนกลับ
git add -A && git commit -m "revert: คืน CustomerStatus.tsx กลับเป็นเวอร์ชั่นเก่า"
```

---

### กรณีที่ 4: ย้อนกลับทั้งโปรเจกต์ไปที่ Checkpoint อื่น (ระวัง!)

```bash
# ดู ID ของ checkpoint ที่ต้องการก่อน
git log --oneline

# ย้อนกลับทั้งหมด (soft = เก็บการเปลี่ยนแปลงไว้ใน Staging)
git reset --soft 74d03c0

# ย้อนกลับทั้งหมด + ลบการเปลี่ยนแปลงทิ้งด้วย (ระวังมาก!)
git reset --hard 74d03c0
```

> ⛔ `--hard` จะลบโค้ดที่แก้ไปหลังจาก checkpoint นั้นออกหมดเลย ไม่สามารถกู้คืนได้

---

## 🏷️ การตั้งชื่อ Tag (Bookmark สำคัญๆ)

ถ้าต้องการบันทึก version ที่สำคัญ เช่น "version ที่ใช้งานได้ดี 100%":

```bash
# ตั้ง Tag ชื่อ v1.0
git tag v1.0 -m "Version แรกที่ใช้งานจริง"

# ดู Tag ทั้งหมด
git tag

# ย้อนกลับมาที่ Tag นี้
git checkout v1.0
```

---

## 📋 คำสั่งที่ใช้บ่อย (สรุป)

| คำสั่ง | หน้าที่ |
| :--- | :--- |
| `git status` | ดูว่าไฟล์ไหนเปลี่ยนไปบ้าง |
| `git log --oneline` | ดูประวัติ Checkpoint ทั้งหมด |
| `git add -A` | เพิ่มทุกไฟล์เข้า Staging |
| `git commit -m "..."` | บันทึก Checkpoint |
| `git restore .` | ยกเลิกการเปลี่ยนแปลงทั้งหมด (ก่อน commit) |
| `git checkout ID -- file` | คืนไฟล์เดียวจาก checkpoint เก่า |
| `git reset --soft ID` | ย้อนกลับทั้งหมด เก็บการเปลี่ยนแปลงไว้ |
| `git reset --hard ID` | ย้อนกลับทั้งหมด + ลบการเปลี่ยนแปลงทิ้ง |
| `git tag v1.0` | ตั้ง bookmark version สำคัญ |

---

## 🔄 Workflow แนะนำ: ก่อนให้ AI แก้โค้ด

```bash
# 1. บันทึก checkpoint ก่อนทุกครั้ง
git add -A && git commit -m "checkpoint: ก่อนให้ AI แก้ระบบ search"

# 2. ให้ AI แก้โค้ด...

# 3. ถ้าพอใจ → commit ใหม่
git add -A && git commit -m "feat: แก้ระบบ search ให้ exact match"

# 4. ถ้าไม่พอใจ → ย้อนกลับ
git restore .
```

---

## ☁️ GitHub (สำรองข้อมูลไว้บน Cloud)

ถ้าต้องการเซฟโค้ดไว้บน Cloud เพิ่มความปลอดภัย:

```bash
# Push โค้ดขึ้น GitHub
git push origin main

# ดึงโค้ดล่าสุดจาก GitHub (เมื่อใช้เครื่องใหม่)
git pull origin main
```

> 💡 ถ้ายังไม่มี GitHub repository ให้สร้างที่ [github.com](https://github.com) แล้วแจ้งผมเพื่อตั้งค่าให้ครับ

---

*อัปเดตล่าสุด มีนาคม 2026*
