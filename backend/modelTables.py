from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True)
    email = Column(String(50), unique=True)
    password = Column(String(50))
    has_issued = Column(Boolean, default=False)

    # Define the book_issue_records attribute for the bidirectional relationship
    book_issue_records = relationship("BookIssueRecord", back_populates="user")


# class Post(Base):
#     __tablename__ = "posts"

#     id = Column(Integer, primary_key=True, index=True)
#     title = Column(String(50))
#     content = Column(String(100))
#     user_id = Column(Integer)

class Librarian(Base):
    __tablename__ = "librarians"

    librarian_id = Column(Integer, primary_key=True, index=True)
    librarian_name =  Column(String(50), unique=True)
    password = Column(String(100), unique=True)
    active = Column(Boolean, default=False)

    # Define the book_issue_records attribute for the bidirectional relationship
    book_issue_records = relationship("BookIssueRecord", back_populates="librarian")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(50), unique=True)
    author = Column(Integer)
    publisher = Column(Integer)
    category = Column(Integer)
    copies = Column(Integer)

    # Define the book_issue_records attribute for the bidirectional relationship
    book_issue_records = relationship("BookIssueRecord", back_populates="book")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))


class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))


class Publisher(Base):
    __tablename__ = "publishers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))


class BookIssueRecord(Base):
    __tablename__ = "Book_issue_records"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey('books.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    issued_by = Column(Integer, ForeignKey('librarians.librarian_id'))
    issue_time = Column(DateTime)
    issue_status = Column(String(10))

    # Establishing relationships with the Book, User, and Librarian tables
    book = relationship("Book", back_populates="book_issue_records")
    user = relationship("User", back_populates="book_issue_records")
    librarian = relationship("Librarian", back_populates="book_issue_records")