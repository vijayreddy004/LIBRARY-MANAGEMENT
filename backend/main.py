from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Annotated
import modelTables
from model import UserBase, Librarian, Book, BookRequest, Category, Author, Publisher, BookIssueRequest, BookIssueRecord, BookSearch, Token

# app instance
app = FastAPI(title="Library Management System")

modelTables.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# database
db_dependency = Annotated[Session, Depends(get_db)]


# JWT Configuration
SECRET_KEY = "9a8d3f94e2c1b0a7f6e5d4c3b2a19081"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360

# variables for authentication
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI OAuth2PasswordBearer for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


#middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)




# _______________________________________________________Authentication____________________________________________________
# common functions for authentication
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_hashed_password(password):
    return pwd_context.hash(password)


def authenticate_user(db: Session, username:str, password:str):
    user = db.query(modelTables.Librarian).filter(modelTables.Librarian.librarian_name == username).first()
    if not user or not verify_password(password, user.password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_active_librarian(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail= "Could not validate creadentials",
         headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credential_exception
        
        user = db.query(modelTables.Librarian).filter(modelTables.Librarian.librarian_name == username).first()
        if user is None:
            raise credential_exception
        return user
    except JWTError:
        raise credential_exception





# _______________________________________________________librarians____________________________________________________
# login and generate jwt token
# sign up librarian
@app.post("/librarians/sign_up", response_model= Token, tags=["auth-librarian"])
async def sign_up(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    existing_librarian = db.query(modelTables.Librarian).filter(modelTables.Librarian.librarian_name == form_data.username).first()
    if existing_librarian:
        raise HTTPException(status_code=422, detail="Librarian already exists!")
    
    hashed_password = get_hashed_password(form_data.password)

    new_librarian = modelTables.Librarian(
        librarian_name=form_data.username, 
        password=hashed_password, 
        active=True
        )
    
    db.add(new_librarian)
    db.commit()

    access_token_expires = timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_librarian.librarian_name}, 
        expires_delta=access_token_expires
        )
    
    return {"access_token": access_token, "token_type": "Bearer"}


# sign in librarian
@app.post("/token", response_model=Token, tags=["auth-librarian"])
async def sign_in(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    db.query(modelTables.Librarian).filter(modelTables.Librarian.librarian_name == form_data.username).update({"active": True})
    db.commit()

     # Generate JWT token for the authenticated librarian
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.librarian_name}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


# get current librarian
@app.get("/users/me", response_model=Librarian, status_code=status.HTTP_200_OK, tags=["auth-librarian"])
async def read_users_me(current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    return current_librarian


# get all librarians
@app.get("/librariains/get_all", status_code=status.HTTP_200_OK, tags=["auth-librarian"])
async def get_all_librarians(db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    all_librarians = db.query(modelTables.Librarian).all()
    if all_librarians is None:
        raise HTTPException(status_code=404, detail="No librarians found!")
    return all_librarians


# get librarian by id
@app.get("/librarians/get_by_id={librarian_id}", status_code=status.HTTP_200_OK, tags=["auth-librarian"])
async def get_librarian_by_id(librarian_id : str, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")

    librarian = db.query(modelTables.Librarian).filter(modelTables.Librarian.librarian_id == librarian_id).first()

    if librarian is None:
        raise HTTPException(404, detail="Librarian not found!")
    
    return librarian


# sign out
@app.post("/librarians/sign_out", status_code=status.HTTP_200_OK, tags=["auth-librarian"])
async def sign_out(db:db_dependency):
    current_librarian = db.query(modelTables.Librarian).filter(modelTables.Librarian.active == True).first()
    db.query(modelTables.Librarian).filter(modelTables.Librarian.librarian_name == current_librarian.librarian_name).update({"active": False})
    db.commit()
    return {"message":"Librarian logged out successfully"}




# _______________________________________________________users____________________________________________________
# create user
@app.post("/users/", status_code=status.HTTP_201_CREATED, tags=["user"])
async def create_user(user: UserBase, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    db_user = modelTables.User(**user.model_dump())
    db.add(db_user)
    db.commit()

    latest_user = db.query(modelTables.User).order_by(modelTables.User.id.desc()).first()
    return latest_user


# get all users
@app.get("/users/get_users", status_code=status.HTTP_200_OK, tags=["user"])
async def get_users(db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    allUsers = db.query(modelTables.User).all()
    if allUsers is None:
        raise HTTPException(status_code=404, detail="No user found!")
    return allUsers


# get user by id
@app.get("/users/get_user_by_id={id}", status_code=status.HTTP_200_OK, tags=["user"])
async def get_user_by_id(id:str, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    user = db.query(modelTables.User).filter(modelTables.User.id == id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="No user found!")
    return user

# check user is in db or not
@app.get("/users/check_user_in_db={user}", status_code=status.HTTP_200_OK, tags=["user"])
async def check_user(user:str, db:db_dependency):
    check_user = db.query(modelTables.User).filter(modelTables.User.username == user).first()

    if check_user is None:
        return 0
    
    return check_user.id


# update user name
@app.put("/user/update_user_name={id}", status_code=status.HTTP_200_OK, tags=["user"])
async def update_user_name(id:str, updated_name:str, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    user = db.query(modelTables.User).filter(modelTables.User.id == id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found!")
    db.query(modelTables.User).filter(modelTables.User.id == id).update({"username":updated_name})
    db.commit()
    return {"message": "user updated successfully"}


# update user
@app.put("/users/update_user={user_id}", status_code=status.HTTP_200_OK, tags=["user"])
async def update_user(user_id: str, updated_user: UserBase, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    user = db.query(modelTables.User).filter(modelTables.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found!")
    
    updated_details = {
        "username" : updated_user.username,
        "email" : updated_user.email,
        "password" : updated_user.password,
        "has_issued": updated_user.has_issued
    }
    db.query(modelTables.User).filter(modelTables.User.id == user_id).update(updated_details)
    db.commit()

    user_updated = db.query(modelTables.User).filter(modelTables.User.id == user_id).first()
    return user_updated


# delete user
@app.delete("/users/delete_user_by_id={id}", status_code=status.HTTP_200_OK, tags=["user"])
async def delete_user_by_id(id:str, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    user = db.query(modelTables.User).filter(modelTables.User.id == id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="No user found!")
    db.delete(user)
    db.commit()
    return {"message":"user deleted successufully"}




# _______________________________________________________books____________________________________________________
# common functionalities
async def get_details(book, db:db_dependency):
    bookCategory = db.query(modelTables.Category).filter(modelTables.Category.id == book.category).first().name
    bookAuthor = db.query(modelTables.Author).filter(modelTables.Author.id == book.author).first().name
    bookPublisher = db.query(modelTables.Publisher).filter(modelTables.Publisher.id == book.publisher).first().name
    book_details = {
        "id": book.id,
        "title": book.title,
        "author": bookAuthor,
        "publisher": bookPublisher,
        "category": bookCategory,
        "copies": book.copies,
    }

    return book_details


# post book
@app.post("/books/", status_code=status.HTTP_200_OK, tags=["book"])
async def add_book(book: BookRequest, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):    
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")

    checkBook = db.query(modelTables.Book).filter(modelTables.Book.title == book.title).first()
    if checkBook is not None:
        book_copies = db.query(modelTables.Book).filter(modelTables.Book.title == book.title).first().copies
        db.query(modelTables.Book).filter(modelTables.Book.title == book.title).update({"copies": book_copies + book.copies})
    else:
        book_author = db.query(modelTables.Author).filter(modelTables.Author.name == book.author).first()
        book_publisher = db.query(modelTables.Publisher).filter(modelTables.Publisher.name == book.publisher).first()
        book_category = db.query(modelTables.Category).filter(modelTables.Category.name == book.category).first()

        #if author & publisher not available, add them in respective tables
        if book_author is None:
            db_author = modelTables.Author(
                name = book.author
            )
            db.add(db_author)
            db.commit()
            new_author = db.query(modelTables.Author).order_by(modelTables.Author.id.desc()).first()
            book_author = new_author

        if book_publisher is None:
            db_publisher = modelTables.Publisher(
                name = book.publisher
            )
            db.add(db_publisher)
            db.commit()
            new_publisher = db.query(modelTables.Publisher).order_by(modelTables.Publisher.id.desc()).first()
            book_publisher = new_publisher

        if book_category is None:
            db_category = modelTables.Category(
                name = book.category
            )
            db.add(db_category)
            db.commit()
            new_category = db.query(modelTables.Category).order_by(modelTables.Category.id.desc()).first()
            book_category = new_category

        # add new book to db
        db_book = modelTables.Book(
            title = book.title,
            author = book_author.id,
            publisher = book_publisher.id,
            category = book_category.id,
            copies = book.copies
        )
        db.add(db_book)
    db.commit()

    latest_book = db.query(modelTables.Book).order_by(modelTables.Book.id.desc()).first()
    return latest_book


# get all books
@app.get("/books/get_all", status_code=status.HTTP_200_OK, tags=["book"])
async def get_all_books(db:db_dependency):
    all_books = db.query(modelTables.Book).all()
    if all_books is None:
        raise HTTPException(status_code=404, detail="No book found!")
    return all_books

@app.get("/books/get_details", status_code=status.HTTP_200_OK, tags=["book"])
async def get_books_details(db:db_dependency):
    all_books = await get_all_books(db)
    all_books_details = []

    if all_books is None:
        raise HTTPException(status_code=404, detail="Books not found!")

    for book in all_books:
        
        book_details = await get_details(book, db)
        all_books_details.append(book_details)

    return all_books_details


# get book by id
@app.get("/books/get_book_by_id={book_id}", status_code=status.HTTP_200_OK, tags=["book"])
async def get_book_by_id(book_id:str, db:db_dependency):
    book = db.query(modelTables.Book).filter(modelTables.Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="book not found!")
    
    book_by_id = await get_details(book, db)
    return book_by_id


# update book by id
@app.put("/books/update_book_by_id={book_id}", status_code=status.HTTP_200_OK, tags=["book"])
async def update_book(book_id:str, updated_book:BookRequest, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    book = db.query(modelTables.Book).filter(modelTables.Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="book not found!")

    book_author = db.query(modelTables.Author).filter(modelTables.Author.name == updated_book.author).first()
    book_publisher = db.query(modelTables.Publisher).filter(modelTables.Publisher.name == updated_book.publisher).first()
    book_category = db.query(modelTables.Category).filter(modelTables.Category.name == updated_book.category).first()

    #if author & publisher not available, add them in respective tables
    if book_author is None:
        db_author = modelTables.Author(
            name = updated_book.author
        )
        db.add(db_author)
        db.commit()
        new_author = db.query(modelTables.Author).order_by(modelTables.Author.id.desc()).first()
        book_author = new_author

    if book_publisher is None:
        db_publisher = modelTables.Publisher(
            name = updated_book.publisher
        )
        db.add(db_publisher)
        db.commit()
        new_publisher = db.query(modelTables.Publisher).order_by(modelTables.Publisher.id.desc()).first()
        book_publisher = new_publisher

    if book_category is None:
        db_category = modelTables.Category(
            name = updated_book.category
        )
        db.add(db_category)
        db.commit()
        new_category = db.query(modelTables.Category).order_by(modelTables.Category.id.desc()).first()
        book_category = new_category
    
    updated_book_details ={
        "title": updated_book.title,
        "author": book_author.id,
        "publisher": book_publisher.id,
        "copies": updated_book.copies
    }

    db.query(modelTables.Book).filter(modelTables.Book.id == book_id).update(updated_book_details)
    db.commit()
    updated_book = db.query(modelTables.Book).filter(modelTables.Book.id == book_id).first()
    return updated_book


# delete book by id
@app.delete("/books/delete_book_by_id={book_id}", status_code=status.HTTP_200_OK, tags=["book"])
async def delete_book_by_id(book_id:str, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    book = db.query(modelTables.Book).filter(modelTables.Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="book not found!")
    db.query(modelTables.Book).filter(modelTables.Book.id == book_id).delete()
    db.commit()
    return {"message": "book deleted successfully"}




# _______________________________________________________categories____________________________________________________
# post category
@app.post("/categories/", status_code=status.HTTP_200_OK, tags=["category"])
async def create_category(category: Category, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    check_category = db.query(modelTables.Category).filter(modelTables.Category.name == category.name).first()
    if check_category is not None:
        raise HTTPException(status_code=404, detail="category already exists")
    
    db_category = modelTables.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    last_inserted_category = db.query(modelTables.Category).order_by(modelTables.Category.id.desc()).first()
    return last_inserted_category


# get all categories
@app.get("/categories/get_all", status_code=status.HTTP_200_OK, tags=["category"])
async def get_all_categories(db: db_dependency):
    
    all_categories = db.query(modelTables.Category).all()

    if all_categories is None:
        raise HTTPException(status_code=404, detail="no category found")
    return all_categories


# get category by id
@app.get("/categories/get_by_id={category_id}", status_code=status.HTTP_200_OK, tags=["category"])
async def get_category_by_id(category_id: str, db: db_dependency):
    category = db.query(modelTables.Category).filter(modelTables.Category.id == category_id).first()
    if category_id is None:
        raise HTTPException(status_code=404, detail="category not found!")
    return category


# update category
@app.put("/categories/update_category={category_id}", status_code=status.HTTP_200_OK, tags=["category"])
async def update_category(category_id: str, updated_category: Category, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    category = db.query(modelTables.Category).filter(modelTables.Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="category not found!")
    
    updated_category_detail = {
        "name": updated_category.name
    }
    db.query(modelTables.Category).filter(modelTables.Category.id == category_id).update(updated_category_detail)
    db.commit()
    category_updated = db.query(modelTables.Category).filter(modelTables.Category.id == category_id).first()
    return category_updated


# delete category
@app.delete("/categories/delete_category={category_id}", status_code=status.HTTP_200_OK, tags=["category"])
async def delete_category(category_id: str, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    category = db.query(modelTables.Category).filter(modelTables.Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="category not found!")
    db.query(modelTables.Category).filter(modelTables.Category.id == category_id).delete()
    db.commit()
    return {"message": "category deleted successfully"}




# _______________________________________________________authors____________________________________________________
# post author
@app.post("/authors/", status_code=status.HTTP_200_OK, tags=["author"])
async def add_author(author: Author, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    check_author = db.query(modelTables.Author).filter(modelTables.Author.name == author.name).first()
    if check_author is not None:
        raise HTTPException(status_code=404, detail="Author already exists")

    db_author = modelTables.Author(**author.model_dump())
    db.add(db_author)
    db.commit()
    last_inserted_author = db.query(modelTables.Author).order_by(modelTables.Author.id.desc()).first()
    return last_inserted_author


# get all authors
@app.get("/authors/get_all", status_code=status.HTTP_200_OK, tags=["author"])
async def get_all_authors(db: db_dependency):
    all_authors = db.query(modelTables.Author).all()

    if all_authors is None:
        raise HTTPException(status_code=404, detail="no author found")
    return all_authors


# get author by id
@app.get("/authors/get_by_id={author_id}", status_code=status.HTTP_200_OK, tags=["author"])
async def get_author_by_id(author_id: str, db: db_dependency):
    author = db.query(modelTables.Author).filter(modelTables.Author.id == author_id).first()
    if author_id is None:
        raise HTTPException(status_code=404, detail="author not found!")
    return author


# update author
@app.put("/authors/update_author={author_id}", status_code=status.HTTP_200_OK, tags=["author"])
async def update_author(author_id: str, updated_author: Author, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    author = db.query(modelTables.Author).filter(modelTables.Author.id == author_id).first()
    if author is None:
        raise HTTPException(status_code=404, detail="author not found!")
    
    updated_author_detail = {
        "name": updated_author.name
    }
    db.query(modelTables.Author).filter(modelTables.Author.id == author_id).update(updated_author_detail)
    db.commit()
    author_updated = db.query(modelTables.Author).filter(modelTables.Author.id == author_id).first()
    return author_updated


# delete author
@app.delete("/authors/delete_author={author_id}", status_code=status.HTTP_200_OK, tags=["author"])
async def delete_author(author_id: str, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    author = db.query(modelTables.Author).filter(modelTables.Author.id == author_id).first()
    if author is None:
        raise HTTPException(status_code=404, detail="user not found!")
    db.query(modelTables.Author).filter(modelTables.Author.id == author_id).delete()
    db.commit()
    return {"message": "Author deleted successfully"}




# _______________________________________________________publishers____________________________________________________
# post Publisher
@app.post("/publishers/", status_code=status.HTTP_200_OK, tags=["publisher"])
async def add_publisher(publisher: Publisher, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    check_publisher = db.query(modelTables.Publisher).filter(modelTables.Publisher.name == publisher.name).first()
    if check_publisher is not None:
        raise HTTPException(status_code=404, detail="Publisher already exists")
    
    db_publisher = modelTables.Publisher(**publisher.model_dump())
    db.add(db_publisher)
    db.commit()
    last_inserted_publisher = db.query(modelTables.Publisher).order_by(modelTables.Publisher.id.desc()).first()
    return last_inserted_publisher


# get all Publishers
@app.get("/publishers/get_all", status_code=status.HTTP_200_OK, tags=["publisher"])
async def get_all_publishers(db: db_dependency):
    all_publishers = db.query(modelTables.Publisher).all()

    if all_publishers is None:
        raise HTTPException(status_code=404, detail="no publisher found!")
    return all_publishers


# get Publisher by id
@app.get("/publishers/get_by_id={publisher_id}", status_code=status.HTTP_200_OK, tags=["publisher"])
async def get_publisher_by_id(publisher_id: str, db: db_dependency):
    publisher = db.query(modelTables.Publisher).filter(modelTables.Publisher.id == publisher_id).first()
    if publisher_id is None:
        raise HTTPException(status_code=404, detail="publisher not found!")
    return publisher


# update Publisher
@app.put("/publishers/update_publisher={publisher_id}", status_code=status.HTTP_200_OK, tags=["publisher"])
async def update_publisher(publisher_id: str, updated_publisher: Publisher, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    publisher = db.query(modelTables.Publisher).filter(modelTables.Publisher.id == publisher_id).first()
    if publisher is None:
        raise HTTPException(status_code=404, detail="publisher not found!")
    
    updated_publisher_detail = {
        "name": updated_publisher.name
    }
    db.query(modelTables.Publisher).filter(modelTables.Publisher.id == publisher_id).update(updated_publisher_detail)
    db.commit()
    publisher_updated = db.query(modelTables.Publisher).filter(modelTables.Publisher.id == publisher_id).first()
    return publisher_updated


# delete Publisher
@app.delete("/publishers/delete_publisher={publisher_id}", status_code=status.HTTP_200_OK, tags=["publisher"])
async def delete_publisher(publisher_id: str, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    publisher = db.query(modelTables.Publisher).filter(modelTables.Publisher.id == publisher_id).first()
    if publisher is None:
        raise HTTPException(status_code=404, detail="publisher not found!")
    db.query(modelTables.Publisher).filter(modelTables.Publisher.id == publisher_id).delete()
    db.commit()
    return {"message": "publisher deleted successfully"}




# _______________________________________________________issue details____________________________________________________
# common functions
async def get_all_bookeIssues(db: db_dependency):
    all_bookIssues = db.query(modelTables.BookIssueRecord).all()
    if all_bookIssues is None:
        raise HTTPException(status_code=404, detail="no details found for book issued!")
    return all_bookIssues

async def get_bookeIssue_details(i, db:db_dependency):
    bookname = db.query(modelTables.Book).filter(modelTables.Book.id == i.book_id).first().title
    username = db.query(modelTables.User).filter(modelTables.User.id == i.user_id).first().username
    issue_details = {
            "id": i.id,
            "bookname": bookname,
            "username": username,
            "issued_by": i.issued_by,
            "issue_time": i.issue_time,
            "issue_status": i.issue_status,
        }
    return issue_details


# post issue details
@app.post("/bookIssues/", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def create_bookIssue_record(book_issue_request: BookIssueRequest, db: db_dependency):
    current_librarian = db.query(modelTables.Librarian).filter(modelTables.Librarian.active == True).first()

    checkBookID = db.query(modelTables.Book).filter(modelTables.Book.id == book_issue_request.book_id).first()
    checkUserID = db.query(modelTables.User).filter(modelTables.User.id == book_issue_request.user_id).first()

    if checkBookID is None:
        raise HTTPException(status_code=404, detail="Book for issue not found!")
    elif checkBookID.copies == 0:
        raise HTTPException(status_code=400, detail="This book is not available to issue!")

    if checkUserID is None:
        raise HTTPException(status_code=404, detail="User for issue not found!")
    elif checkUserID.has_issued:
        raise HTTPException(status_code=400, detail="User is not valid to issue book!")
    
    all_bookIssues = await get_all_bookeIssues(db)
    for book in all_bookIssues:
        if book.book_id == checkBookID.id and book.user_id == checkUserID.id and checkUserID.has_issued == True:
            raise HTTPException(status_code=400, detail="User has already requested to issue this book!")

    issue_time = datetime.now()

    if current_librarian:
        issued_by = current_librarian.librarian_id
        issue_status = "issued"
    else:
        issued_by = None
        issue_status = "pending"

    db_book_issue = modelTables.BookIssueRecord(
        book_id= book_issue_request.book_id,
        user_id= book_issue_request.user_id,
        issued_by= issued_by,
        issue_time= issue_time,
        issue_status= issue_status
    )
    db.add(db_book_issue)

    if current_librarian:
        book_copies = db.query(modelTables.Book).filter(modelTables.Book.id == book_issue_request.book_id).first().copies
        db.query(modelTables.Book).filter(modelTables.Book.id == book_issue_request.book_id).update(
            {"copies": book_copies - 1}
        )
        db.query(modelTables.User).filter(modelTables.User.id == book_issue_request.user_id).update(
            {"has_issued": True}
        )
    db.commit()

    latest_issue_details = db.query(modelTables.BookIssueRecord).order_by(modelTables.BookIssueRecord.id.desc()).first()
    return latest_issue_details


# get all book issues
@app.get("/bookIssues/get_all", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def get_all_bookIssued_details(db:db_dependency):    
    all_bookIssued = await get_all_bookeIssues(db)

    all_bookIssues_details = []
    for i in all_bookIssued:
        issue_details = await get_bookeIssue_details(i, db)
        all_bookIssues_details.append(issue_details)
    return all_bookIssues_details


# get book issue by id
@app.get("/bookIssues/get_by_id={bookIssue_id}", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def get_bookIssue_by_id(bookIssue_id:str, db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    bookIssue = db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).first()
    if bookIssue is None:
        raise HTTPException(status_code=404, detail="no book issue details is found!")
    
    bookIssue_details = await get_bookeIssue_details(bookIssue, db)
    return bookIssue_details


# get book issue details user wise
@app.get("/get_bookIssues_by_user={userId}", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def get_bookIssues_by_user(userId: int, db:db_dependency):
    check_user = db.query(modelTables.User).filter(modelTables.User.id == userId).first()
    if check_user is None:
        raise HTTPException(status_code=404, detail="User not exists in db!")
    all_bookeIssues = await get_all_bookIssued_details(db)
    bookIssuesByUser = []

    for book in all_bookeIssues:
        if book["username"] == check_user.username:
            bookIssuesByUser.append(book)

    return bookIssuesByUser


# update book issue process
@app.put("/update_bookIssue={bookIssue_id}", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def update_bookIssue(bookIssue_id: int, db:db_dependency):
    current_librarian_id = db.query(modelTables.Librarian).filter(modelTables.Librarian.active == True).first().librarian_id
    if not current_librarian_id:
        raise HTTPException(401, detail="You are not authenticated")
    
    check_bookIssue_record = db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).first()
    if check_bookIssue_record is None:
        raise HTTPException(status_code=404, detail="No book issue record!")
    
    check_user = db.query(modelTables.User).filter(modelTables.User.id == check_bookIssue_record.user_id).first()
    if check_user.has_issued == True:
        raise HTTPException(status_code=400, detail="user is not eligible to issue book!")
    
    if check_bookIssue_record.issue_status == "pending" and check_user.has_issued == False:
        db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).update({"issue_status": "issued", "issued_by": current_librarian_id})
        db.query(modelTables.User).filter(modelTables.User.id == check_bookIssue_record.user_id).update({"has_issued": True})
        book_copies = db.query(modelTables.Book).filter(modelTables.Book.id == check_bookIssue_record.book_id).first().copies
        
        if book_copies < 1:
            raise HTTPException(status_code=400, detail="Book not available")
        else:
            db.query(modelTables.Book).filter(modelTables.Book.id == check_bookIssue_record.book_id).update({"copies": book_copies - 1})
        db.commit()

    latest_record = db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == check_bookIssue_record.id).first()
    return latest_record


# book return process   # return bookIssues by id
@app.put("/bookIssues/return_bookIssue={bookIssue_id}", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def return_bookIssue(bookIssue_id: str, db: db_dependency):
    bookIssue = db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).first()
    if bookIssue is None:
        raise HTTPException(status_code=404, detail="book issues not found!")
    
    db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).update({"issue_status": "returned"})
    book_copies = db.query(modelTables.Book).filter(modelTables.Book.id == bookIssue.book_id).first().copies
    db.query(modelTables.Book).filter(modelTables.Book.id == bookIssue.book_id).update({"copies": book_copies + 1})
    db.query(modelTables.User).filter(modelTables.User.id == bookIssue.user_id).update({"has_issued": False})
    db.commit()
    return {"message": "Book has been returned successfully"}


# book return process    # delete bookIssues by id
@app.delete("/bookIssues/delete_returned_book={bookIssue_id}", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def delete_returned_book(bookIssue_id: str, db: db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")

    bookIssue = db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).first()
    if bookIssue is None:
        raise HTTPException(status_code=404, detail="book issues not found!")
    if bookIssue.issue_status == "returned":
        db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).delete()
        db.commit()
    else:
        raise HTTPException(status_code=400, detail="Book has not been returned to the library")
    return {"message": "Returned book deleted successfully"}


# book return process   # delete bookIssues by id
@app.delete("/bookIssues/delete_bookIssue={bookIssue_id}", status_code=status.HTTP_200_OK, tags=["bookIssue"])
async def delete_bookIssue_by_id(bookIssue_id: str, db: db_dependency):
    bookIssue = db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).first()
    if bookIssue is None:
        raise HTTPException(status_code=404, detail="book issues not found!")
    
    db.query(modelTables.BookIssueRecord).filter(modelTables.BookIssueRecord.id == bookIssue_id).delete()
    book_copies = db.query(modelTables.Book).filter(modelTables.Book.id == bookIssue.book_id).first().copies
    db.query(modelTables.Book).filter(modelTables.Book.id == bookIssue.book_id).update({"copies": book_copies + 1})
    db.query(modelTables.User).filter(modelTables.User.id == bookIssue.user_id).update({"has_issued": False})
    db.commit()
    return {"message": "book issue details deleted successfully"}




# _______________________________________________________searching book____________________________________________________
# searching book by:-
# search book by title
@app.get("/bookSearch/get_book_by_title={title}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_book_by_title(title:str, db:db_dependency):
    all_books = await get_books_details(db)
    searched_books = []
    for book in all_books:
        if title.lower() in book["title"].lower():
            searched_books.append(book)
    return searched_books


# search book by author
@app.get("/bookSearch/get_book_by_author={author}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_book_by_author(author:str, db:db_dependency):
    all_books = await get_books_details(db)
    search_books = []
    for book in all_books:
        if author.lower() in book["author"].lower():
            search_books.append(book)

    return search_books


# search book by publisher
@app.get("/bookSearch/get_book_by_publisher={publisher}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_book_by_publisher(publisher:str, db:db_dependency):
    all_books = await get_books_details(db)
    search_books = []
    for book in all_books:
        if publisher.lower() in book["publisher"].lower():
            search_books.append(book)

    return search_books


# # search by title and author
@app.get("/bookSearch/get_book_by_title_and_author/{title}/{author}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_books_by_title_and_author(title:str, author: str, db:db_dependency):
    all_books = await get_books_details(db)
    searched_books = []
    for book in all_books:
        if title.lower() in book["title"].lower() and author.lower() in book["author"].lower():
            searched_books.append(book)
            
    return searched_books


# search by title and publisher
@app.get("/bookSearch/get_book_by_title_and_publisher/{title}/{publisher}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_books_by_title_and_publisher(title:str, publisher: str, db:db_dependency):
    all_books = await get_books_details(db)
    searched_books = []

    for book in all_books:
        if title.lower() in book["title"].lower() and publisher.lower() in book["publisher"].lower():
            searched_books.append(book)
            
    return searched_books


# search by title, author and publisher
@app.get("/bookSearch/get_book_by_title_author_publisher/{title}/{author}/{publisher}", status_code= status.HTTP_200_OK, tags=["bookSearch"])
async def get_book_by_title_author_publisher(db:db_dependency, title:str, author: str, publisher: str):
    all_books = await get_books_details(db)
    searched_books = []

    for book in all_books:
        if title.lower() in book["title"].lower() and author.lower() in book["author"].lower() and publisher.lower() in book["publisher"].lower():
            searched_books.append(book)

    return searched_books


# search by title or author or publisher
@app.get("/bookSearch/get_searched_Books/search={search}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_searched_books(search:str, db:db_dependency):
    all_books = await get_books_details(db)
    searched_books = []
    for book in all_books:
        if search.lower() in book["title"].lower() or search.lower() in book["author"].lower() or search.lower() in book["publisher"].lower():
            searched_books.append(book)

    return searched_books


# get books by categories
@app.get("/bookSearch/get_books_by_category={cat_id}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_books_by_category(cat_id: int, db:db_dependency):
    checkCategory = db.query(modelTables.Category).filter(modelTables.Category.id == cat_id).first()
    if checkCategory is None:
        raise HTTPException(status_code=404, detail="Cateogy not found!")
    
    all_books = await get_books_details(db)
    searched_books = []

    for book in all_books:
        if book["category"] == checkCategory.name:
            searched_books.append(book)

    return searched_books


# get searched book from books by category
@app.get("/bookSearch/get_books_by_category={cat_id}/search={search}", status_code=status.HTTP_200_OK, tags=["bookSearch"])
async def get_searchedBook_by_category(cat_id: int, search: str, db:db_dependency):
    books_by_category = await get_books_by_category(cat_id, db)
    searched_books = []
    for book in books_by_category:
        if search.lower() in book["title"].lower() or search.lower() in book["author"].lower() or search.lower() in book["publisher"].lower():
            searched_books.append(book)

    return searched_books




# _______________________________________________________searching user____________________________________________________
# searching user
# search by has_issued
@app.get("/userSearch/get_issued_user", status_code=status.HTTP_200_OK, tags=["userSearch"])
async def get_issued_user(db:db_dependency, current_librarian: Librarian = Depends(get_current_active_librarian)):
    if not current_librarian:
        raise HTTPException(401, detail="You are not authenticated")
    
    all_users = await get_users(db)
    issued_users = []
    for i in all_users:
        if i.has_issued == True:
            issued_users.append(i)
    return issued_users


