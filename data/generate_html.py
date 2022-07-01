import json

def process_experience(experience):
    item = "<p class=\"experience\">" + experience["name"] + "</p>"
    if "with" in experience.keys():
        item += "<span class=\"with\">" + experience["with"] + "</span> <br>"
    item += "<span class=\"date\">" + experience["date"] + "</span>"
    if "description" in experience.keys():
        description = "<div class=\"content\" style=\"display:none;\"><p>" + experience["description"] + "</p></div>"
        item = "<div class=\"collapsible\">" + item + "</div>" + description
    return item

def process_class(clas):
    subject_codes = {"cs" : "CS", "math" : "Math", "linguistics" : "Ling"}
    item = "<li class=\"collapsible\">" + subject_codes[clas["subject"]] + " " + str(clas["number"]) + ": " + clas["name"] + "</li>"
    description = "<div class=\"description\" class=\"content\" style=\"display:none;\"><p>" + clas["description"] + "</p></div>"
    return item + description

def get_classes(classes):
    rdict = {"cs" : [], "math": [], "linguistics": []}
    for clas in classes:
        rdict[clas["subject"]].append(process_class(clas))
    return rdict

def generate(maintemplate, maindest, blogtemplate, blogdest):
    f = open(maintemplate, "r")
    result = f.read()
    f.close()

    f = open("data/contact.json")
    contact = json.load(f)
    for key, value in contact.items():
        result = result.replace("#"+key, value)
    f.close()

    f = open("data/blurb.txt", "r")
    result = result.replace("#blurb", f.read())
    f.close()

    f = open("data/experience.json")
    experiences = json.load(f)
    result = result.replace("#experience", "".join([process_experience(experience) for experience in experiences]))
    f.close()
    
    f = open("data/blog.html", "r")
    blog = f.read()
    result = result.replace("#blog", blog)
    f.close()

    f = open("data/classes.json")
    classes = json.load(f)
    class_dict = get_classes(classes)
    for key, value in class_dict.items():
        result = result.replace("#"+ key + "classes", "".join(value))
    f.close()

    f = open(maindest, "w+")
    f.write(result)
    f.close()

    # blog index
    
    f = open(blogtemplate, "r")
    result = f.read()
    f.close()

    f = open("data/blog.html", "r")
    blog = f.read()
    result = result.replace("#blog", blog)
    f.close()

    f = open(blogdest, "w+")
    f.write(result)
    f.close()

if __name__ == "__main__":
    generate("data/index_template.html", "index.html", "data/blog_template.html", "blog/index.html")