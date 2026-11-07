from sqlalchemy.orm import sessionmaker


from database import engine
from models import FaqItem, FaqDocument
from faq_data import FAQ_ITEMS



Session = sessionmaker(bind=engine)



def seed():
    db = Session()


    try:
        created = 0
        updated = 0


        for item in FAQ_ITEMS:
            existing = db.query(FaqItem).filter_by(
                code=item["code"]
            ).first()


            if existing:
                existing.category = item["category"]
                existing.question = item["question"]
                existing.answer = item["answer"]
                existing.alternative_questions = item["alternative_questions"]
                existing.source_url = item.get("source_url")
                existing.source_name = item.get("source_name")
                existing.validity_note = item.get("validity_note")
                existing.status = "approved"

                faq = existing
                updated += 1
            else:
                faq = FaqItem(
                    code=item["code"],
                    category=item["category"],
                    question=item["question"],
                    answer=item["answer"],
                    alternative_questions=item["alternative_questions"],
                    source_url=item.get("source_url"),
                    source_name=item.get("source_name"),
                    validity_note=item.get("validity_note"),
                    status="approved",
                )

                db.add(faq)
                db.flush()
                created += 1


            existing_documents = db.query(FaqDocument).filter_by(
                faq_id=faq.id
            ).all()


            for document in existing_documents:
                db.delete(document)


            for document in item.get("documents", []):
                db.add(
                    FaqDocument(
                        faq_id=faq.id,
                        title=document["title"],
                        file_url=document["file_url"],
                    )
                )


        db.commit()


        print(
            f"FAQs sincronizadas correctamente: "
            f"{created} nuevas, {updated} actualizadas."
        )


    except Exception as error:
        db.rollback()
        print(f"Error cargando FAQs: {error}")
        raise


    finally:
        db.close()



if __name__ == "__main__":
    seed()